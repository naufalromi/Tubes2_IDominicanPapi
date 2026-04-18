package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
	"golang.org/x/net/html"
	"regexp"
)

type Node struct {
	tag_name     string
	attributes   map[string]string
	parent       *Node
	children     []*Node
}

type SelectorPart struct {
	Tag        string
	ID         string
	Classes    []string
	Attributes map[string]string
	Combinator string
}

type LogEntry struct {
	Step   int
	Node   string
	Action string
}

type SearchResult struct {
	NodesVisited int
	TimeTaken    time.Duration
	MaxDepth     int
	MatchedNodes []*Node
	TraversalLog []LogEntry
}

var void_tags = map[string]bool{
	"area": true, "base": true, "br": true, "col": true, "embed": true,
	"hr": true, "img": true, "input": true, "link": true, "meta": true,
	"param": true, "source": true, "track": true, "wbr": true,
}

func fetchHTML(target_url string) (string, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", target_url, nil)
	if err != nil {
		return "", fmt.Errorf("gagal membuat request: %v", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gagal mengambil data dari URL: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("status: %v", resp.Status)
	}

	body_bytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gagal membaca body: %v", err)
	}

	return string(body_bytes), nil
}

func buildDOMTree(html_content string) *Node {
	reader := strings.NewReader(html_content)
	z := html.NewTokenizer(reader)

	root := &Node{
		tag_name:   "#document",
		attributes: nil,
		children:   []*Node{},
		parent:     nil,
	}

	stack := []*Node{root}

	auto_close := func(tag string) {
		for len(stack) > 1 {
			top := stack[len(stack)-1]

			if top.tag_name == "li" && tag == "li" {
				stack = stack[:len(stack)-1]
				continue
			}

			if top.tag_name == "p" {
				inline := map[string]bool{
					"a": true, "span": true, "b": true, "i": true,
					"u": true, "em": true, "strong": true,
				}

				if !inline[tag] {
					stack = stack[:len(stack)-1]
					continue
				}
			}

			break
		}
	}

	for {
		tt := z.Next()
		if tt == html.ErrorToken {
			if z.Err() == io.EOF {
				break
			}
			fmt.Println("Tokenizer error:", z.Err())
			break
		}

		token := z.Token()

		switch tt {

		case html.StartTagToken, html.SelfClosingTagToken:
			tag := strings.ToLower(token.Data)

			auto_close(tag)

			parent := stack[len(stack)-1]

			new_node := &Node{
				tag_name:   tag,
				attributes: make(map[string]string),
				children:   []*Node{},
				parent:     parent,
			}

			for _, attr := range token.Attr {
				new_node.attributes[attr.Key] = attr.Val
			}

			parent.children = append(parent.children, new_node)

			if tag == "script" || tag == "style" {
				for {
					if z.Next() == html.EndTagToken {
						endToken := z.Token()
						if strings.ToLower(endToken.Data) == tag {
							break
						}
					}
				}
				continue
			}

			is_void := void_tags[tag] || tt == html.SelfClosingTagToken
			if !is_void {
				stack = append(stack, new_node)
			}

		case html.EndTagToken:
			tag := strings.ToLower(token.Data)
			for i := len(stack) - 1; i > 0; i-- {
				if stack[i].tag_name == tag {
					stack = stack[:i]
					break
				}
			}
		}
	}

	return root
}

func printTree(node *Node, depth int) {
	if node == nil {
		return
	}

	indent := strings.Repeat("  ", depth)

	fmt.Printf("%s<%s>", indent, node.tag_name)

	if id, ok := node.attributes["id"]; ok {
		fmt.Printf(" #%s", id)
	}

	if class, ok := node.attributes["class"]; ok {
		classes := strings.Split(class, " ")
		for _, c := range classes {
			if c != "" {
				fmt.Printf(" .%s", c)
			}
		}
	}

	fmt.Println()

	for _, child := range node.children {
		printTree(child, depth+1)
	}
}

func ParseSingleToken(token string, currentCombinator string) SelectorPart {
	part := SelectorPart{
		Classes:    []string{},
		Attributes: make(map[string]string),
		Combinator: currentCombinator,
	}

	reAttr := regexp.MustCompile(`\[([a-zA-Z0-9_-]+)=([^\]]+)\]`)
	attrMatches := reAttr.FindAllStringSubmatch(token, -1)
	for _, m := range attrMatches {
		part.Attributes[m[1]] = m[2]
	}
	token = reAttr.ReplaceAllString(token, "") 

	reID := regexp.MustCompile(`#([a-zA-Z0-9_-]+)`)
	if idMatch := reID.FindStringSubmatch(token); idMatch != nil {
		part.ID = idMatch[1]
	}
	token = reID.ReplaceAllString(token, "") 

	reClass := regexp.MustCompile(`\.([a-zA-Z0-9_-]+)`)
	classMatches := reClass.FindAllStringSubmatch(token, -1)
	for _, m := range classMatches {
		part.Classes = append(part.Classes, m[1])
	}
	token = reClass.ReplaceAllString(token, "") 

	if token != "" && token != "*" {
		part.Tag = token
	}

	return part
}

func ParseSelector(query string) []SelectorPart {
	query = strings.ReplaceAll(query, ">", " > ")
	query = strings.ReplaceAll(query, "+", " + ")
	query = strings.ReplaceAll(query, "~", " ~ ")
	
	tokens := strings.Fields(query)

	var parts []SelectorPart
	nextCombinator := ""

	for i, token := range tokens {
		if token == ">" || token == "+" || token == "~" {
			nextCombinator = token
			continue
		}

		if i > 0 && nextCombinator == "" {
			nextCombinator = " "
		}

		part := ParseSingleToken(token, nextCombinator)
		parts = append(parts, part)

		nextCombinator = ""
	}

	return parts
}

func MatchIdentity(n *Node, part SelectorPart) bool {
	if part.Tag != "" && part.Tag != "*" && n.tag_name != part.Tag {
		return false
	}
	if part.ID != "" && n.attributes["id"] != part.ID {
		return false
	}
	if len(part.Classes) > 0 {
		nodeClasses := strings.Split(n.attributes["class"], " ")
		classMap := make(map[string]bool)
		for _, c := range nodeClasses {
			classMap[c] = true
		}
		for _, requiredClass := range part.Classes {
			if !classMap[requiredClass] {
				return false
			}
		}
	}
	for k, v := range part.Attributes {
		if n.attributes[k] != v {
			return false
		}
	}
	return true
}

func GetPrevSibling(n *Node) *Node {
	if n.parent == nil {
		return nil
	}
	for i, child := range n.parent.children {
		if child == n {
			if i > 0 {
				return n.parent.children[i-1]
			}
			return nil
		}
	}
	return nil
}

func IsMatch(n *Node, parts []SelectorPart) bool {
	if len(parts) == 0 {
		return true
	}
	if n == nil {
		return false
	}

	currentPart := parts[len(parts)-1]

	if !MatchIdentity(n, currentPart) {
		return false
	}

	if len(parts) == 1 {
		return true
	}

	remainingParts := parts[:len(parts)-1]
	combinator := currentPart.Combinator

	switch combinator {
	case ">":
		return IsMatch(n.parent, remainingParts)
		
	case " ":
		temp := n.parent
		for temp != nil && temp.tag_name != "#document" {
			if IsMatch(temp, remainingParts) {
				return true
			}
			temp = temp.parent
		}
		return false
		
	case "+": 
		prev := GetPrevSibling(n)
		return IsMatch(prev, remainingParts)
		
	case "~": 
		temp := GetPrevSibling(n)
		for temp != nil {
			if IsMatch(temp, remainingParts) {
				return true
			}
			temp = GetPrevSibling(temp)
		}
		return false
	}

	return false
}

func SearchBFS(root *Node, parts []SelectorPart, limit int) ([]*Node, []LogEntry) {
	var results []*Node
	var log []LogEntry
	stepCount := 0

	queue := []*Node{root}

	for len(queue) > 0 && (limit <= 0 || len(results) < limit) {
		node := queue[0]
		queue = queue[1:]

		if node.tag_name != "#document" {
			stepCount++
			nodeName := node.tag_name
			if id := node.attributes["id"]; id != "" { nodeName += "#" + id }

			log = append(log, LogEntry{Step: stepCount, Node: nodeName, Action: "Checking"})

			if IsMatch(node, parts) {
				results = append(results, node)
				log[len(log)-1].Action = "Match!"
			}
		}

		for _, child := range node.children {
			queue = append(queue, child)
		}
	}

	return results, log
}

func SearchDFS(node *Node, parts []SelectorPart, limit int, results *[]*Node, log *[]LogEntry, stepCount *int) {
	if node == nil || (limit > 0 && len(*results) >= limit) {
		return
	}

	if node.tag_name == "#document" {
		for _, child := range node.children {
			SearchDFS(child, parts, limit, results, log, stepCount)
		}
		return
	}

	*stepCount++
	
	nodeName := node.tag_name
	if id := node.attributes["id"]; id != "" { nodeName += "#" + id }

	*log = append(*log, LogEntry{Step: *stepCount, Node: nodeName, Action: "Checking"})

	if IsMatch(node, parts) {
		*results = append(*results, node)
		(*log)[len(*log)-1].Action = "Match!"
		
		if limit > 0 && len(*results) >= limit {
			return
		}
	}

	for _, child := range node.children {
		SearchDFS(child, parts, limit, results, log, stepCount)
	}
}

func CalculateMaxDepth(node *Node) int {
	if node == nil {
		return 0
	}
	maxChildDepth := 0
	for _, child := range node.children {
		depth := CalculateMaxDepth(child)
		if depth > maxChildDepth {
			maxChildDepth = depth
		}
	}
	return maxChildDepth + 1
}

func main() {
	// url := "https://en.wikipedia.org/wiki/6-7_meme"
	// html_content, err := fetchHTML(url)

	htmlContent, err := os.ReadFile("test.txt")

	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	html_content := string(htmlContent)

	fmt.Println("Membangun DOM Tree...")
	tree := buildDOMTree(html_content)

	// fmt.Println("\nMencetak DOM Tree: ")
	// printTree(tree, 24)

	selectorQuery := "div.mw-parser-output > p"
	parts := ParseSelector(selectorQuery)
	limit := 0

	fmt.Printf("\nMenjalankan Pencarian CSS Selector: '%s'\n", selectorQuery)

	startBFS := time.Now()
	bfsResults, bfsLog := SearchBFS(tree, parts, limit)
	durBFS := time.Since(startBFS)

	fmt.Printf("\n[Hasil Breadth-First Search (BFS)]\n")
	fmt.Printf("Waktu Pencarian : %v\n", durBFS)
	fmt.Printf("Node Dikunjungi : %d node\n", len(bfsLog))
	fmt.Printf("Banyak Hasil    : %d elemen\n", len(bfsResults))
	for i, res := range bfsResults {
		fmt.Printf("  - Match %d: <%s id='%s' class='%s'>\n", i+1, res.tag_name, res.attributes["id"], res.attributes["class"])
	}

	startDFS := time.Now()
	var dfsResults []*Node
	var dfsLog []LogEntry
	stepCount := 0
	SearchDFS(tree, parts, limit, &dfsResults, &dfsLog, &stepCount)
	durDFS := time.Since(startDFS)

	fmt.Printf("\n[Hasil Depth-First Search (DFS)]\n")
	fmt.Printf("Waktu Pencarian : %v\n", durDFS)
	fmt.Printf("Node Dikunjungi : %d node\n", len(dfsLog))
	fmt.Printf("Banyak Hasil    : %d elemen\n", len(dfsResults))
	for i, res := range dfsResults {
		fmt.Printf("  - Match %d: <%s id='%s' class='%s'>\n", i+1, res.tag_name, res.attributes["id"], res.attributes["class"])
	}

	maxDepth := CalculateMaxDepth(tree)
	fmt.Printf("\nKedalaman Maksimum (Max Depth) Pohon DOM: %d\n", maxDepth)

	// fmt.Println("\nTraversal Log BFS: ")
	// for i := 0; i < len(bfsLog); i++ {
	// 	if bfsLog[i].Action == "Match!" {
	// 		fmt.Printf("  %d: Node <%s> : %s\n", dfsLog[i].Step, dfsLog[i].Node, dfsLog[i].Action)
	// 	} else {
	// 		fmt.Printf("  %d: Node <%s> : %s\n", dfsLog[i].Step, dfsLog[i].Node, dfsLog[i].Action)
	// 	}
	// }

	// fmt.Println("\nTraversal Log DFS: ")
	// for i := 0; i < len(dfsLog); i++ {
	// 	if dfsLog[i].Action == "Match!" {
	// 		fmt.Printf("  %d: Node <%s> : %s\n", dfsLog[i].Step, dfsLog[i].Node, dfsLog[i].Action)
	// 	} else {
	// 		fmt.Printf("  %d: Node <%s> : %s\n", dfsLog[i].Step, dfsLog[i].Node, dfsLog[i].Action)
	// 	}
	// }
}