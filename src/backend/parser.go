package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
	"golang.org/x/net/html"
)

type node struct {
	ID         string            `json:"node_id"`
	Index      int               `json:"-"`
	TagName    string            `json:"tag"`
	Data       string            `json:"data,omitempty"`
	Attributes map[string]string `json:"attributes"`
	Children   []*node           `json:"children"`
	Parent     *node             `json:"-"`
}

type selectorPart struct {
	Tag        string
	ID         string
	Classes    []string
	Attributes map[string]string
	Combinator string
}

type logEntry struct {
	Step     int    `json:"step"`
	NodeID   string `json:"node_id"`
	ParentID string `json:"parent_id"`
	Depth    int    `json:"depth"`
	Tag      string `json:"tag"`
	Action   string `json:"action"`
	Matched  bool   `json:"matched"`
}

type matchInfo struct {
	NodeID      string            `json:"node_id"`
	Tag         string            `json:"tag"`
	Attributes  map[string]string `json:"attributes"`
	TextPreview string            `json:"text_preview"`
	Path        []string          `json:"path"`
}

type searchResponse struct {
	RequestID    string      `json:"request_id"`
	Selector     string      `json:"selector"`
	Algorithm    string      `json:"algorithm"`
	ResultMode   string      `json:"result_mode"`
	Limit        int         `json:"limit"`
	Stats        searchStats `json:"stats"`
	Matches      []matchInfo `json:"matches"`
	DOMTree      *node       `json:"dom_tree"`
	TraversalLog []logEntry  `json:"traversal_log"`
}

type searchStats struct {
	VisitedNodes int     `json:"visited_nodes"`
	MatchedNodes int     `json:"matched_nodes"`
	MaxDepth     int     `json:"max_depth"`
	SearchTimeMS float64 `json:"search_time_ms"`
}

type searchState struct {
	Node         *node
	TargetIdx    int
	Depth        int
	IncomingComb string
}

var void_tags = map[string]bool{
	"area": true, "base": true, "br": true, "col": true, "embed": true,
	"hr": true, "img": true, "input": true, "link": true, "meta": true,
	"param": true, "source": true, "track": true, "wbr": true,
}

func fetchHtml(target_url string) (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", target_url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body_bytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(body_bytes), nil
}

func buildDomTree(html_content string) *node {
	reader := strings.NewReader(html_content)
	tokenizer := html.NewTokenizer(reader)

	node_counter := 0
	generate_id := func() string {
		node_counter++
		return fmt.Sprintf("n%d", node_counter)
	}

	root := &node{
		ID:       generate_id(),
		TagName:  "#document",
		Children: []*node{},
	}

	stack := []*node{root}

	auto_close := func(tag string) {
		for len(stack) > 1 {
			top := stack[len(stack)-1]
			if (top.TagName == "li" && tag == "li") || (top.TagName == "p" && !isInline(tag)) {
				stack = stack[:len(stack)-1]
				continue
			}
			break
		}
	}

	for {
		tt := tokenizer.Next()
		if tt == html.ErrorToken {
			break
		}
		token := tokenizer.Token()

		switch tt {
		case html.StartTagToken, html.SelfClosingTagToken:
			tag := strings.ToLower(token.Data)
			auto_close(tag)

			parent := stack[len(stack)-1]
			new_node := &node{
				ID:         generate_id(),
				TagName:    tag,
				Attributes: make(map[string]string),
				Children:   []*node{},
				Parent:     parent,
			}

			for _, attr := range token.Attr {
				new_node.Attributes[attr.Key] = attr.Val
			}

			parent.Children = append(parent.Children, new_node)

			if tag == "script" || tag == "style" {
				for tokenizer.Next() != html.EndTagToken || strings.ToLower(tokenizer.Token().Data) != tag {
				}
				continue
			}

			if !void_tags[tag] && tt != html.SelfClosingTagToken {
				stack = append(stack, new_node)
			}

		case html.EndTagToken:
			tag := strings.ToLower(token.Data)
			for i := len(stack) - 1; i > 0; i-- {
				if stack[i].TagName == tag {
					stack = stack[:i]
					break
				}
			}

		case html.TextToken:
			text_data := strings.TrimSpace(token.Data)
			if text_data == "" {
				continue
			}
			parent := stack[len(stack)-1]
			text_node := &node{
				ID:         generate_id(),
				TagName:    "#text",
				Data:       text_data,
				Attributes: make(map[string]string),
				Children:   []*node{},
				Parent:     parent,
			}
			parent.Children = append(parent.Children, text_node)

		case html.CommentToken:
			comment_data := token.Data
			parent := stack[len(stack)-1]
			comment_node := &node{
				ID:         generate_id(),
				TagName:    "#comment",
				Data:       comment_data,
				Attributes: make(map[string]string),
				Children:   []*node{},
				Parent:     parent,
			}
			parent.Children = append(parent.Children, comment_node)
		}
	}
	return root
}

func isInline(tag string) bool {
	inline := map[string]bool{"a": true, "span": true, "b": true, "i": true, "u": true, "strong": true, "em": true}
	return inline[tag]
}

func parseSelector(query string) []selectorPart {
	query = regexp.MustCompile(`\s*([>+~])\s*`).ReplaceAllString(query, " $1 ")
	tokens := strings.Fields(query)
	var parts []selectorPart
	next_comb := ""

	for i, token := range tokens {
		if token == ">" || token == "+" || token == "~" {
			next_comb = token
			continue
		}
		if i > 0 && next_comb == "" {
			next_comb = " "
		}
		parts = append(parts, parseSingleToken(token, next_comb))
		next_comb = ""
	}
	return parts
}

func parseSingleToken(token string, comb string) selectorPart {
	part := selectorPart{Classes: []string{}, Attributes: make(map[string]string), Combinator: comb}

	re_attr := regexp.MustCompile(`\[([a-zA-Z0-9_-]+)=([^\]]+)\]`)
	for _, m := range re_attr.FindAllStringSubmatch(token, -1) {
		cleaned := strings.Trim(m[2], `"'`) 
    	part.Attributes[m[1]] = cleaned
	}
	token = re_attr.ReplaceAllString(token, "")

	re_id := regexp.MustCompile(`#([a-zA-Z0-9_-]+)`)
	if m := re_id.FindStringSubmatch(token); m != nil {
		part.ID = m[1]
	}
	token = re_id.ReplaceAllString(token, "")

	re_class := regexp.MustCompile(`\.([a-zA-Z0-9_-]+)`)
	for _, m := range re_class.FindAllStringSubmatch(token, -1) {
		part.Classes = append(part.Classes, m[1])
	}
	token = re_class.ReplaceAllString(token, "")

	if token != "" && token != "*" {
		part.Tag = strings.ToLower(token)
	}
	return part
}

func matchIdentity(n *node, part selectorPart) bool {
	if n.TagName == "#text" || n.TagName == "#comment" {
		return false
	}
	if part.Tag != "" && part.Tag != "*" && n.TagName != part.Tag {
		return false
	}
	if part.ID != "" && n.Attributes["id"] != part.ID {
		return false
	}
	if len(part.Classes) > 0 {
		node_classes := strings.Split(n.Attributes["class"], " ")
		for _, req := range part.Classes {
			found := false
			for _, c := range node_classes {
				if c == req {
					found = true
					break
				}
			}
			if !found {
				return false
			}
		}
	}
	for k, v := range part.Attributes {
		if n.Attributes[k] != v {
			return false
		}
	}
	return true
}

func getNextElementSibling(n *node) *node {
	if n.Parent == nil {
		return nil
	}
	found_self := false
	for _, c := range n.Parent.Children {
		if c == n {
			found_self = true
			continue
		}
		if found_self && c.TagName != "#text" && c.TagName != "#comment" {
			return c
		}
	}
	return nil
}

func getNextElementSiblings(n *node) []*node {
	var siblings []*node
	if n.Parent == nil {
		return siblings
	}
	found_self := false
	for _, c := range n.Parent.Children {
		if c == n {
			found_self = true
			continue
		}
		if found_self && c.TagName != "#text" && c.TagName != "#comment" {
			siblings = append(siblings, c)
		}
	}
	return siblings
}

func extractText(n *node) string {
	var text_parts []string
	var extract func(*node)

	extract = func(current_node *node) {
		for _, c := range current_node.Children {
			if c.TagName == "#text" {
				text_parts = append(text_parts, c.Data)
			} else if c.TagName != "#comment" && c.TagName != "script" && c.TagName != "style" {
				extract(c)
			}
		}
	}
	extract(n)
	return strings.TrimSpace(strings.Join(text_parts, " "))
}

func getNodePath(n *node) []string {
	var path []string
	for curr := n; curr != nil && curr.TagName != "#document"; curr = curr.Parent {
		step_str := curr.TagName
		if id, ok := curr.Attributes["id"]; ok && id != "" {
			step_str += "#" + id
		} else if cls, ok := curr.Attributes["class"]; ok && cls != "" {
			classes := strings.Split(strings.TrimSpace(cls), " ")
			step_str += "." + strings.Join(classes, ".")
		}
		path = append([]string{step_str}, path...)
	}
	return path
}

func searchBfs(root *node, parts []selectorPart, limit int) ([]matchInfo, []logEntry) {
	var results []matchInfo
	var log []logEntry
	step := 0
	visited := make(map[string]bool)

	queue := []searchState{{Node: root, TargetIdx: 0, Depth: 0, IncomingComb: ""}}

	for len(queue) > 0 {
		if limit > 0 && len(results) >= limit {
			break
		}

		curr := queue[0]
		queue = queue[1:]
		n := curr.Node

		state_key := fmt.Sprintf("%s_%d", n.ID, curr.TargetIdx)
		if visited[state_key] {
			continue
		}
		visited[state_key] = true

		if n.TagName != "#document" {
			step++
			matched := matchIdentity(n, parts[curr.TargetIdx])
			action := "visit"

			if matched && curr.TargetIdx == len(parts)-1 {
				action = "MATCH FOUND"
			} else if matched {
				action = fmt.Sprintf("match part %d", curr.TargetIdx)
			}

			parent_id := ""
			if n.Parent != nil {
				parent_id = n.Parent.ID
			}

			log = append(log, logEntry{step, n.ID, parent_id, curr.Depth, n.TagName, action, matched})

			if action == "MATCH FOUND" {
				results = append(results, matchInfo{n.ID, n.TagName, n.Attributes, extractText(n), getNodePath(n)})
			}

			if n.TagName != "#text" && n.TagName != "#comment" {
				if matched && curr.TargetIdx < len(parts)-1 {
					next_comb := parts[curr.TargetIdx+1].Combinator
					if next_comb == " " || next_comb == ">" {
						for _, c := range n.Children {
							queue = append(queue, searchState{c, curr.TargetIdx + 1, curr.Depth + 1, next_comb})
						}
					} else if next_comb == "+" {
						if sibling := getNextElementSibling(n); sibling != nil {
							queue = append(queue, searchState{sibling, curr.TargetIdx + 1, curr.Depth, next_comb})
						}
					} else if next_comb == "~" {
						for _, sibling := range getNextElementSiblings(n) {
							queue = append(queue, searchState{sibling, curr.TargetIdx + 1, curr.Depth, next_comb})
						}
					}
				} else if !matched {
					if curr.TargetIdx > 0 && curr.IncomingComb == " " {
						for _, c := range n.Children {
							queue = append(queue, searchState{c, curr.TargetIdx, curr.Depth + 1, " "})
						}
					} else if curr.TargetIdx > 0 && curr.IncomingComb == "~" {
						for _, sibling := range getNextElementSiblings(n) {
							queue = append(queue, searchState{sibling, curr.TargetIdx, curr.Depth, "~"})
						}
					}
				}

				if curr.TargetIdx == 0 {
					for _, c := range n.Children {
						queue = append(queue, searchState{c, 0, curr.Depth + 1, ""})
					}
				}
			} else {
				if curr.TargetIdx == 0 {
					for _, c := range n.Children {
						queue = append(queue, searchState{c, 0, curr.Depth + 1, ""})
					}
				}
			}
		} else {
			for _, c := range n.Children {
				queue = append(queue, searchState{c, 0, curr.Depth + 1, ""})
			}
		}
	}
	return results, log
}

func searchDfs(root *node, parts []selectorPart, limit int) ([]matchInfo, []logEntry) {
	var results []matchInfo
	var log []logEntry
	step := 0
	visited := make(map[string]bool)

	searchDfsRecursive(searchState{Node: root, TargetIdx: 0, Depth: 0, IncomingComb: ""}, parts, limit, &step, &results, &log, visited)
	return results, log
}

func searchDfsRecursive(curr searchState, parts []selectorPart, limit int, step *int, results *[]matchInfo, log *[]logEntry, visited map[string]bool) {
	if limit > 0 && len(*results) >= limit {
		return
	}

	n := curr.Node
	if n == nil {
		return
	}

	state_key := fmt.Sprintf("%s_%d", n.ID, curr.TargetIdx)
	if visited[state_key] {
		return
	}
	visited[state_key] = true

	if n.TagName != "#document" {
		*step++
		matched := matchIdentity(n, parts[curr.TargetIdx])
		action := "visit"

		if matched && curr.TargetIdx == len(parts)-1 {
			action = "MATCH FOUND"
		} else if matched {
			action = fmt.Sprintf("match part %d", curr.TargetIdx)
		}

		parent_id := ""
		if n.Parent != nil {
			parent_id = n.Parent.ID
		}

		*log = append(*log, logEntry{*step, n.ID, parent_id, curr.Depth, n.TagName, action, matched})

		if action == "MATCH FOUND" {
			*results = append(*results, matchInfo{n.ID, n.TagName, n.Attributes, extractText(n), getNodePath(n)})
		}

		if n.TagName != "#text" && n.TagName != "#comment" {
			next_comb := ""
			if curr.TargetIdx < len(parts)-1 {
				next_comb = parts[curr.TargetIdx+1].Combinator
			}

			pass_target_next := matched && curr.TargetIdx < len(parts)-1 && (next_comb == " " || next_comb == ">")
			pass_target_propagate := !matched && curr.TargetIdx > 0 && curr.IncomingComb == " "
			pass_target_0 := curr.TargetIdx == 0

			for _, c := range n.Children {
				if pass_target_next {
					searchDfsRecursive(searchState{c, curr.TargetIdx + 1, curr.Depth + 1, next_comb}, parts, limit, step, results, log, visited)
				}
				if pass_target_propagate {
					searchDfsRecursive(searchState{c, curr.TargetIdx, curr.Depth + 1, " "}, parts, limit, step, results, log, visited)
				}
				if pass_target_0 {
					searchDfsRecursive(searchState{c, 0, curr.Depth + 1, ""}, parts, limit, step, results, log, visited)
				}
			}

			if matched && curr.TargetIdx < len(parts)-1 {
				if next_comb == "+" {
					if sibling := getNextElementSibling(n); sibling != nil {
						searchDfsRecursive(searchState{sibling, curr.TargetIdx + 1, curr.Depth, next_comb}, parts, limit, step, results, log, visited)
					}
				} else if next_comb == "~" {
					for _, sibling := range getNextElementSiblings(n) {
						searchDfsRecursive(searchState{sibling, curr.TargetIdx + 1, curr.Depth, next_comb}, parts, limit, step, results, log, visited)
					}
				}
			} else if !matched && curr.TargetIdx > 0 && curr.IncomingComb == "~" {
				for _, sibling := range getNextElementSiblings(n) {
					searchDfsRecursive(searchState{sibling, curr.TargetIdx, curr.Depth, "~"}, parts, limit, step, results, log, visited)
				}
			}

		} else {
			if curr.TargetIdx == 0 {
				for _, c := range n.Children {
					searchDfsRecursive(searchState{c, 0, curr.Depth + 1, ""}, parts, limit, step, results, log, visited)
				}
			}
		}
	} else {
		for _, c := range n.Children {
			searchDfsRecursive(searchState{c, 0, curr.Depth + 1, ""}, parts, limit, step, results, log, visited)
		}
	}
}

func calculateMaxDepth(n *node) int {
	if n == nil {
		return 0
	}
	max := 0
	for _, c := range n.Children {
		d := calculateMaxDepth(c)
		if d > max {
			max = d
		}
	}
	return max + 1
}

func main() {
	html_content_bytes, err := os.ReadFile("test.txt")
	if err != nil {
		fmt.Println("Error reading test.txt:", err)
		return
	}
	html_content := string(html_content_bytes)

	fmt.Println("Memulai Parsing DOM Tree...")
	tree := buildDomTree(html_content)

	selector := "main#content .article-body > section ~ div.box.target > span.badge"
	algorithm := "dfs"
	result_mode := "top_n"
	limit := 3

	fmt.Printf("Menjalankan Pencarian: '%s' menggunakan %s (Mode: %s, Limit: %d)\n", selector, strings.ToUpper(algorithm), result_mode, limit)
	parts := parseSelector(selector)
	start := time.Now()

	var matches []matchInfo
	var log []logEntry

	search_limit := 0
	if result_mode == "top_n" {
		search_limit = limit
	}

	if algorithm == "bfs" {
		matches, log = searchBfs(tree, parts, search_limit)
	} else {
		matches, log = searchDfs(tree, parts, search_limit)
	}

	duration := time.Since(start)

	response := searchResponse{
		RequestID:  "srch_001",
		Selector:   selector,
		Algorithm:  algorithm,
		ResultMode: result_mode,
		Limit:      limit,
		Stats: searchStats{
			VisitedNodes: len(log),
			MatchedNodes: len(matches),
			MaxDepth:     calculateMaxDepth(tree),
			SearchTimeMS: float64(duration.Microseconds()) / 1000.0,
		},
		Matches:      matches,
		DOMTree:      tree,
		TraversalLog: log,
	}

	json_data, _ := json.MarshalIndent(response, "", "  ")
	fmt.Println("\nHasil JSON:")
	fmt.Println(string(json_data))
}