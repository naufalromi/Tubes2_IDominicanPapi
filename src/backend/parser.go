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

type Node struct {
	ID         string            `json:"node_id"`
	TagName    string            `json:"tag"`
	Attributes map[string]string `json:"attributes"`
	Children   []*Node           `json:"children"`
	Parent     *Node             `json:"-"`
}

type SelectorPart struct {
	Tag        string
	ID         string
	Classes    []string
	Attributes map[string]string
	Combinator string
}

type LogEntry struct {
	Step     int    `json:"step"`
	NodeID   string `json:"node_id"`
	ParentID string `json:"parent_id"`
	Depth    int    `json:"depth"`
	Tag      string `json:"tag"`
	Action   string `json:"action"`
	Matched  bool   `json:"matched"`
}

type MatchInfo struct {
	NodeID      string            `json:"node_id"`
	Tag         string            `json:"tag"`
	Attributes  map[string]string `json:"attributes"`
	TextPreview string            `json:"text_preview"`
	Path        []string          `json:"path"`
}

type SearchResponse struct {
	RequestID    string      `json:"request_id"`
	Selector     string      `json:"selector"`
	Algorithm    string      `json:"algorithm"`
	ResultMode   string      `json:"result_mode"`
	Limit        int         `json:"limit"`
	Stats        SearchStats `json:"stats"`
	Matches      []MatchInfo `json:"matches"`
	DOMTree      *Node       `json:"dom_tree"`
	TraversalLog []LogEntry  `json:"traversal_log"`
}

type SearchStats struct {
	VisitedNodes int     `json:"visited_nodes"`
	MatchedNodes int     `json:"matched_nodes"`
	MaxDepth     int     `json:"max_depth"`
	SearchTimeMS float64 `json:"search_time_ms"`
}

var void_tags = map[string]bool{
	"area": true, "base": true, "br": true, "col": true, "embed": true,
	"hr": true, "img": true, "input": true, "link": true, "meta": true,
	"param": true, "source": true, "track": true, "wbr": true,
}

func fetchHtml(target_url string) (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", target_url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body_bytes, _ := io.ReadAll(resp.Body)
	return string(body_bytes), nil
}

func buildDomTree(html_content string) *Node {
	reader := strings.NewReader(html_content)
	tokenizer := html.NewTokenizer(reader)

	node_counter := 0
	generate_id := func() string {
		node_counter++
		return fmt.Sprintf("n%d", node_counter)
	}

	root := &Node{
		ID:       generate_id(),
		TagName:  "#document",
		Children: []*Node{},
	}

	stack := []*Node{root}

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
			new_node := &Node{
				ID:         generate_id(),
				TagName:    tag,
				Attributes: make(map[string]string),
				Children:   []*Node{},
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
		}
	}
	return root
}

func isInline(tag string) bool {
	inline := map[string]bool{"a": true, "span": true, "b": true, "i": true, "u": true, "strong": true, "em": true}
	return inline[tag]
}

func parseSelector(query string) []SelectorPart {
	query = regexp.MustCompile(`\s*([>+~])\s*`).ReplaceAllString(query, " $1 ")
	tokens := strings.Fields(query)
	var parts []SelectorPart
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

func parseSingleToken(token string, comb string) SelectorPart {
	part := SelectorPart{Classes: []string{}, Attributes: make(map[string]string), Combinator: comb}
	
	re_attr := regexp.MustCompile(`\[([a-zA-Z0-9_-]+)=([^\]]+)\]`)
	for _, m := range re_attr.FindAllStringSubmatch(token, -1) {
		part.Attributes[m[1]] = m[2]
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
		part.Tag = token
	}
	return part
}

func matchIdentity(n *Node, part SelectorPart) bool {
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
				if c == req { found = true; break }
			}
			if !found { return false }
		}
	}
	for k, v := range part.Attributes {
		if n.Attributes[k] != v { return false }
	}
	return true
}

func isMatch(n *Node, parts []SelectorPart) bool {
	if len(parts) == 0 || n == nil { return len(parts) == 0 }
	curr := parts[len(parts)-1]
	if !matchIdentity(n, curr) { return false }
	if len(parts) == 1 { return true }

	rem := parts[:len(parts)-1]
	switch curr.Combinator {
	case ">": return isMatch(n.Parent, rem)
	case " ":
		for p := n.Parent; p != nil && p.TagName != "#document"; p = p.Parent {
			if isMatch(p, rem) { return true }
		}
	case "+":
		if prev := getPrevSibling(n); prev != nil { return isMatch(prev, rem) }
	case "~":
		for p := getPrevSibling(n); p != nil; p = getPrevSibling(p) {
			if isMatch(p, rem) { return true }
		}
	}
	return false
}

func getPrevSibling(n *Node) *Node {
	if n.Parent == nil { return nil }
	for i, c := range n.Parent.Children {
		if c == n && i > 0 { return n.Parent.Children[i-1] }
	}
	return nil
}

func getNodePath(n *Node) []string {
	var path []string
	for curr := n; curr != nil && curr.TagName != "#document"; curr = curr.Parent {
		path = append([]string{curr.TagName}, path...)
	}
	return path
}

func searchBfs(root *Node, parts []SelectorPart, limit int) ([]MatchInfo, []LogEntry) {
	var results []MatchInfo
	var log []LogEntry
	type queueItem struct {
		node  *Node
		depth int
	}
	queue := []queueItem{{root, 0}}
	step := 0

	for len(queue) > 0 {
		if limit > 0 && len(results) >= limit {
			break
		}

		curr := queue[0]
		queue = queue[1:]
		n, d := curr.node, curr.depth

		if n.TagName != "#document" {
			step++
			matched := isMatch(n, parts)
			parent_id := ""
			if n.Parent != nil { parent_id = n.Parent.ID }

			entry := LogEntry{step, n.ID, parent_id, d, n.TagName, "visit", matched}
			if matched {
				entry.Action = "MATCH FOUND"
				results = append(results, MatchInfo{n.ID, n.TagName, n.Attributes, "", getNodePath(n)})
			}
			log = append(log, entry)
		}

		for _, child := range n.Children {
			queue = append(queue, queueItem{child, d + 1})
		}
	}
	return results, log
}

func searchDfs(n *Node, parts []SelectorPart, depth int, limit int, step *int, results *[]MatchInfo, log *[]LogEntry) {
	if n == nil || (limit > 0 && len(*results) >= limit) {
		return
	}

	if n.TagName != "#document" {
		*step++
		matched := isMatch(n, parts)
		parent_id := ""
		if n.Parent != nil { parent_id = n.Parent.ID }

		entry := LogEntry{*step, n.ID, parent_id, depth, n.TagName, "visit", matched}
		if matched {
			entry.Action = "MATCH FOUND"
			*results = append(*results, MatchInfo{n.ID, n.TagName, n.Attributes, "", getNodePath(n)})
			
			if limit > 0 && len(*results) >= limit {
				*log = append(*log, entry)
				return
			}
		}
		*log = append(*log, entry)
	}

	for _, child := range n.Children {
		searchDfs(child, parts, depth+1, limit, step, results, log)
	}
}

func calculateMaxDepth(n *Node) int {
	if n == nil { return 0 }
	max := 0
	for _, c := range n.Children {
		d := calculateMaxDepth(c)
		if d > max { max = d }
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

	fmt.Println("1. Memulai Parsing DOM Tree...")
    tree := buildDomTree(html_content)

    selector := "main#content .article-body li" 
    algorithm := "bfs" 
	result_mode := "top_n" 
	limit := 3            

	fmt.Printf("2. Menjalankan Pencarian: '%s' menggunakan %s (Mode: %s, Limit: %d)\n", selector, algorithm, result_mode, limit)
	parts := parseSelector(selector)
	start := time.Now()

	var matches []MatchInfo
	var log []LogEntry

	search_limit := 0
	if result_mode == "top_n" {
		search_limit = limit
	}

	if algorithm == "bfs" {
		matches, log = searchBfs(tree, parts, search_limit)
	} else {
		step := 0
		searchDfs(tree, parts, 0, search_limit, &step, &matches, &log)
	}

	duration := time.Since(start)

	response := SearchResponse{
		RequestID:  "srch_001",
		Selector:   selector,
		Algorithm:  algorithm,
		ResultMode: result_mode,
		Limit:      limit,
		Stats: SearchStats{
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
	fmt.Println("\n--- FINAL JSON RESPONSE ---")
	fmt.Println(string(json_data))
}