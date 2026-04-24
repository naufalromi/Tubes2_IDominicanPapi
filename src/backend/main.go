package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
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

type sourceInfo struct {
	Type        string `json:"type"`
	ResolvedURL string `json:"resolved_url,omitempty"`
}

type searchResponse struct {
	RequestID     string      `json:"request_id"`
	SourceInfo    sourceInfo  `json:"source_info"`
	Selector      string      `json:"selector"`
	Algorithm     string      `json:"algorithm"`
	ResultMode    string      `json:"result_mode"`
	Limit         int         `json:"limit,omitempty"`
	Stats         searchStats `json:"stats"`
	Matches       []matchInfo `json:"matches"`
	TraversalPath []string    `json:"traversal_path"`
	DOMTree       *node       `json:"dom_tree,omitempty"`
	TraversalLog  []logEntry  `json:"traversal_log,omitempty"`
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

type source struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type searchRequest struct {
	Source      source `json:"source"`
	Algorithm   string `json:"algorithm"`
	Selector    string `json:"selector"`
	ResultMode  string `json:"result_mode"`
	Limit       int    `json:"limit"`
	IncludeTree bool   `json:"include_tree"`
	IncludeLog  bool   `json:"include_log"`
}

type searchTask struct {
	mu      sync.Mutex 
	wg      sync.WaitGroup 
	visited map[string]bool
	results []matchInfo
	log     []logEntry
	step    int
	limit   int
}

var void_tags = map[string]bool{
	"area": true, "base": true, "br": true, "col": true, "embed": true,
	"hr": true, "img": true, "input": true, "link": true, "meta": true,
	"param": true, "source": true, "track": true, "wbr": true,
}

var tin []int
var tout []int
var timer int
var up [][]*node

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
		Index:    node_counter - 1,
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
				Index:      node_counter - 1,
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

func parseSelector(query string) ([]selectorPart, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, fmt.Errorf("selector cannot be empty")
	}

	query = regexp.MustCompile(`\s*([>+~])\s*`).ReplaceAllString(query, " $1 ")
	tokens := strings.Fields(query)
	
	var parts []selectorPart
	next_comb := ""

	for i, token := range tokens {
		if token == ">" || token == "+" || token == "~" {
			if i == 0 || i == len(tokens)-1 {
				return nil, fmt.Errorf("combinator '%s' cannot be at the start or end", token)
			}
			next_comb = token
			continue
		}
		
		if i > 0 && next_comb == "" {
			next_comb = " "
		}

		part, err := parseSingleToken(token, next_comb)
		if err != nil {
			return nil, err 
		}
		
		parts = append(parts, part)
		next_comb = ""
	}
	return parts, nil
}

func parseSingleToken(token string, comb string) (selectorPart, error) {
	part := selectorPart{Classes: []string{}, Attributes: make(map[string]string), Combinator: comb}

	original_token := token

	re_attr := regexp.MustCompile(`\[([a-zA-Z0-9_-]+)=([^\]]+)\]`)
	token = re_attr.ReplaceAllString(token, "")

	re_id := regexp.MustCompile(`#([a-zA-Z0-9_-]+)`)
	if strings.Contains(token, "#") && !re_id.MatchString(original_token) {
		return part, fmt.Errorf("invalid ID selector: '%s'", original_token)
	}
	if m := re_id.FindStringSubmatch(original_token); m != nil {
		part.ID = m[1]
	}
	token = re_id.ReplaceAllString(token, "")

	re_class := regexp.MustCompile(`\.([a-zA-Z0-9_-]+)`)
	if strings.Contains(token, ".") && !re_class.MatchString(original_token) {
		return part, fmt.Errorf("invalid Class selector: '%s'", original_token)
	}
	for _, m := range re_class.FindAllStringSubmatch(original_token, -1) {
		part.Classes = append(part.Classes, m[1])
	}
	token = re_class.ReplaceAllString(token, "")

	if token != "" && token != "*" {
		if !regexp.MustCompile(`^[a-zA-Z0-9-]+$`).MatchString(token) {
			return part, fmt.Errorf("invalid Tag name: '%s'", token)
		}
		part.Tag = strings.ToLower(token)
	}

	return part, nil
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
	results := make([]matchInfo, 0)
	log := make([]logEntry, 0)
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
				}

				if curr.TargetIdx > 0 && curr.IncomingComb == " " {
					for _, c := range n.Children {
						queue = append(queue, searchState{c, curr.TargetIdx, curr.Depth + 1, " "})
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

func searchBfsConcurrent(root *node, parts []selectorPart, limit int) ([]matchInfo, []logEntry) {
	task := &searchTask{
		visited: make(map[string]bool),
		results: make([]matchInfo, 0),
		log:     make([]logEntry, 0),
		limit:   limit,
	}

	queue := []searchState{{Node: root, TargetIdx: 0, Depth: 0, IncomingComb: ""}}

	for len(queue) > 0 {
		task.mu.Lock()
		if task.limit > 0 && len(task.results) >= task.limit {
			task.mu.Unlock()
			break
		}
		task.mu.Unlock()

		var next_queue []searchState
		var wg sync.WaitGroup

		for _, curr := range queue {
			wg.Add(1)
			
			go func(currState searchState) {
				defer wg.Done()

				task.mu.Lock()
				if task.limit > 0 && len(task.results) >= task.limit {
					task.mu.Unlock()
					return
				}
				task.mu.Unlock()

				n := currState.Node
				if n == nil {
					return
				}

				state_key := fmt.Sprintf("%s_%d", n.ID, currState.TargetIdx)
				
				task.mu.Lock()
				if task.visited[state_key] {
					task.mu.Unlock()
					return
				}
				task.visited[state_key] = true
				task.mu.Unlock()

				var local_next []searchState

				if n.TagName != "#document" {
					task.mu.Lock()
					task.step++
					current_step := task.step
					task.mu.Unlock()

					matched := matchIdentity(n, parts[currState.TargetIdx])
					action := "visit"

					if matched && currState.TargetIdx == len(parts)-1 {
						action = "MATCH FOUND"
					} else if matched {
						action = fmt.Sprintf("match part %d", currState.TargetIdx)
					}

					parent_id := ""
					if n.Parent != nil {
						parent_id = n.Parent.ID
					}

					task.mu.Lock()
					task.log = append(task.log, logEntry{current_step, n.ID, parent_id, currState.Depth, n.TagName, action, matched})
					if action == "MATCH FOUND" {
						task.results = append(task.results, matchInfo{n.ID, n.TagName, n.Attributes, extractText(n), getNodePath(n)})
					}
					task.mu.Unlock()

					if n.TagName != "#text" && n.TagName != "#comment" {
						next_comb := ""
						if currState.TargetIdx < len(parts)-1 {
							next_comb = parts[currState.TargetIdx+1].Combinator
						}

						if matched && currState.TargetIdx < len(parts)-1 {
							if next_comb == " " || next_comb == ">" {
								for _, c := range n.Children {
									local_next = append(local_next, searchState{c, currState.TargetIdx + 1, currState.Depth + 1, next_comb})
								}
							} else if next_comb == "+" {
								if sibling := getNextElementSibling(n); sibling != nil {
									local_next = append(local_next, searchState{sibling, currState.TargetIdx + 1, currState.Depth, next_comb})
								}
							} else if next_comb == "~" {
								for _, sibling := range getNextElementSiblings(n) {
									local_next = append(local_next, searchState{sibling, currState.TargetIdx + 1, currState.Depth, next_comb})
								}
							}
						}

						if currState.TargetIdx > 0 && currState.IncomingComb == " " {
							for _, c := range n.Children {
								local_next = append(local_next, searchState{c, currState.TargetIdx, currState.Depth + 1, " "})
							}
						}

						if currState.TargetIdx == 0 {
							for _, c := range n.Children {
								local_next = append(local_next, searchState{c, 0, currState.Depth + 1, ""})
							}
						}
					} else {
						if currState.TargetIdx == 0 {
							for _, c := range n.Children {
								local_next = append(local_next, searchState{c, 0, currState.Depth + 1, ""})
							}
						}
					}
				} else {
					for _, c := range n.Children {
						local_next = append(local_next, searchState{c, 0, currState.Depth + 1, ""})
					}
				}

				if len(local_next) > 0 {
					task.mu.Lock()
					next_queue = append(next_queue, local_next...)
					task.mu.Unlock()
				}
			}(curr)
		}

		wg.Wait()

		queue = next_queue
	}

	return task.results, task.log
}

func searchDfs(root *node, parts []selectorPart, limit int) ([]matchInfo, []logEntry) {
	results := make([]matchInfo, 0)
	log := make([]logEntry, 0)
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
			pass_target_propagate := curr.TargetIdx > 0 && curr.IncomingComb == " "
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

func searchDfsConcurrent(root *node, parts []selectorPart, limit int) ([]matchInfo, []logEntry) {
	task := &searchTask{
		visited: make(map[string]bool),
		results: make([]matchInfo, 0),
		log:     make([]logEntry, 0),
		limit:   limit,
	}

	task.wg.Add(1)
	go searchDfsRecursiveConcurrent(searchState{Node: root, TargetIdx: 0, Depth: 0, IncomingComb: ""}, parts, task)

	task.wg.Wait()

	return task.results, task.log
}

func searchDfsRecursiveConcurrent(curr searchState, parts []selectorPart, task *searchTask) {
	defer task.wg.Done() 

	task.mu.Lock()
	if task.limit > 0 && len(task.results) >= task.limit {
		task.mu.Unlock()
		return
	}
	task.mu.Unlock()

	n := curr.Node
	if n == nil {
		return
	}

	state_key := fmt.Sprintf("%s_%d", n.ID, curr.TargetIdx)
	
	task.mu.Lock()
	if task.visited[state_key] {
		task.mu.Unlock()
		return
	}
	task.visited[state_key] = true
	task.mu.Unlock()

	if n.TagName != "#document" {
		task.mu.Lock()
		task.step++
		current_step := task.step
		task.mu.Unlock()

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

		task.mu.Lock()
		task.log = append(task.log, logEntry{current_step, n.ID, parent_id, curr.Depth, n.TagName, action, matched})
		if action == "MATCH FOUND" {
			task.results = append(task.results, matchInfo{n.ID, n.TagName, n.Attributes, extractText(n), getNodePath(n)})
		}
		task.mu.Unlock()

		if n.TagName != "#text" && n.TagName != "#comment" {
			next_comb := ""
			if curr.TargetIdx < len(parts)-1 {
				next_comb = parts[curr.TargetIdx+1].Combinator
			}

			pass_target_next := matched && curr.TargetIdx < len(parts)-1 && (next_comb == " " || next_comb == ">")
			pass_target_propagate := curr.TargetIdx > 0 && curr.IncomingComb == " "
			pass_target_0 := curr.TargetIdx == 0

			for _, c := range n.Children {
				if pass_target_next {
					task.wg.Add(1)
					go searchDfsRecursiveConcurrent(searchState{c, curr.TargetIdx + 1, curr.Depth + 1, next_comb}, parts, task)
				}
				if pass_target_propagate {
					task.wg.Add(1)
					go searchDfsRecursiveConcurrent(searchState{c, curr.TargetIdx, curr.Depth + 1, " "}, parts, task)
				}
				if pass_target_0 {
					task.wg.Add(1)
					go searchDfsRecursiveConcurrent(searchState{c, 0, curr.Depth + 1, ""}, parts, task)
				}
			}

			if matched && curr.TargetIdx < len(parts)-1 {
				if next_comb == "+" {
					if sibling := getNextElementSibling(n); sibling != nil {
						task.wg.Add(1)
						go searchDfsRecursiveConcurrent(searchState{sibling, curr.TargetIdx + 1, curr.Depth, next_comb}, parts, task)
					}
				} else if next_comb == "~" {
					for _, sibling := range getNextElementSiblings(n) {
						task.wg.Add(1)
						go searchDfsRecursiveConcurrent(searchState{sibling, curr.TargetIdx + 1, curr.Depth, next_comb}, parts, task)
					}
				}
			}

		} else {
			if curr.TargetIdx == 0 {
				for _, c := range n.Children {
					task.wg.Add(1)
					go searchDfsRecursiveConcurrent(searchState{c, 0, curr.Depth + 1, ""}, parts, task)
				}
			}
		}

	} else {
		for _, c := range n.Children {
			task.wg.Add(1)
			go searchDfsRecursiveConcurrent(searchState{c, 0, curr.Depth + 1, ""}, parts, task)
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

func countNodes(root *node) int {
	if root == nil {
		return 0
	}
	count := 1
	for _, c := range root.Children {
		count += countNodes(c)
	}
	return count
}

func dfsLCA(n1 *node, n2 *node, logN int) {
	timer++
	tin[n1.Index] = timer
	up[n1.Index][0] = n2
	for i := 1; i < logN; i++ {
		up[n1.Index][i] = up[up[n1.Index][i-1].Index][i-1]
	}
	for _, c := range n1.Children {
		if c != n2 {
			dfsLCA(c, n1, logN)
		}
	}
	tout[n1.Index] = timer
}

func isAncestor(u *node, v *node) bool {
	return tin[u.Index] <= tin[v.Index] && tout[u.Index] >= tout[v.Index]
}

func LCA(u *node, v *node, logN int) *node {
	if isAncestor(u, v) {
		return u
	}
	if isAncestor(v, u) {
		return v
	}
	for i := logN - 1; i >= 0; i-- {
		if !isAncestor(up[u.Index][i], v) {
			u = up[u.Index][i]
		}
	}
	return up[u.Index][0]
}

func preprocessLCA(root *node) {
	n := countNodes(root)
	tin = make([]int, n)
	tout = make([]int, n)
	timer = 0
	logN := int(math.Ceil(math.Log2(float64(n))))
	up = make([][]*node, n)
	for i := range up {
		up[i] = make([]*node, logN)
	}
	dfsLCA(root, root, logN)
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Metode tidak diizinkan. Gunakan POST.", http.StatusMethodNotAllowed)
		return
	}

	var req_data searchRequest
	err := json.NewDecoder(r.Body).Decode(&req_data)
	if err != nil {
		http.Error(w, "Gagal memparsing JSON dari request", http.StatusBadRequest)
		return
	}

	var html_content string
	source_info := sourceInfo{Type: req_data.Source.Type}

	if req_data.Source.Type == "url" {
		html_content, err = fetchHtml(req_data.Source.Value)
		if err != nil {
			http.Error(w, fmt.Sprintf("Gagal mengambil HTML dari URL: %v", err), http.StatusInternalServerError)
			return
		}
		source_info.ResolvedURL = req_data.Source.Value
	} else if req_data.Source.Type == "html" {
		html_content = req_data.Source.Value
	} else if req_data.Source.Type == "file" {
		html_content_bytes, err := os.ReadFile(req_data.Source.Value)
		if err != nil {
			http.Error(w, fmt.Sprintf("Gagal membaca file lokal: %v", err), http.StatusInternalServerError)
			return
		}
		html_content = string(html_content_bytes)
	} else {
		http.Error(w, "Tipe source tidak valid. Gunakan 'url' atau 'html'.", http.StatusBadRequest)
		return
	}

	tree := buildDomTree(html_content)
	parts, err := parseSelector(req_data.Selector)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Selector Error: " + err.Error(),
		})
		return
	}
	start := time.Now()

	matches := make([]matchInfo, 0)
	log := make([]logEntry, 0)

	search_limit := 0
	if req_data.ResultMode == "top_n" {
		search_limit = req_data.Limit
	}

	if req_data.Algorithm == "bfs" {
		matches, log = searchBfsConcurrent(tree, parts, search_limit)
	} else {
		matches, log = searchDfsConcurrent(tree, parts, search_limit)
	} 

	duration := time.Since(start)

	traversal_path := make([]string, 0, len(log))
	for _, entry := range log {
		traversal_path = append(traversal_path, entry.NodeID)
	}

	var res_tree *node
	if req_data.IncludeTree {
		res_tree = tree
	}

	res_log := make([]logEntry, 0)
	if req_data.IncludeLog {
		res_log = log
	}

	response := searchResponse{
		RequestID:  fmt.Sprintf("srch_%d", time.Now().Unix()),
		SourceInfo: source_info,
		Selector:   req_data.Selector,
		Algorithm:  req_data.Algorithm,
		ResultMode: req_data.ResultMode,
		Limit:      req_data.Limit,
		Stats: searchStats{
			VisitedNodes: len(log),
			MatchedNodes: len(matches),
			MaxDepth:     calculateMaxDepth(tree),
			SearchTimeMS: float64(duration.Microseconds()) / 1000.0,
		},
		Matches:       matches,
		TraversalPath: traversal_path,
		DOMTree:       res_tree,
		TraversalLog:  res_log,
	}

	// preprocessLCA(tree)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	http.HandleFunc("/api/search", handleSearch)

	port := ":8080"
	fmt.Printf("Server berjalan di http://localhost%s\n", port)

	err := http.ListenAndServe(port, nil)
	if err != nil {
		fmt.Println("Server gagal dijalankan:", err)
	}
}