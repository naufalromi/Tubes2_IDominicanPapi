package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/net/html"
)

type Node struct {
	tag_name     string
	attributes   map[string]string
	text_content string
	parent       *Node
	children     []*Node
	isText       bool
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

		case html.TextToken:
			continue

		case html.CommentToken:
			continue
		}
	}

	return root
}

func printTree(node *Node, depth int) {
	if node == nil {
		return
	}

	indent := strings.Repeat("  ", depth)

	if node.isText {
		text := node.text_content
		if len(text) > 40 {
			text = text[:40] + "..."
		}
		fmt.Printf("%s\"%s\"\n", indent, text)
		return
	}

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

func main() {
	// url := "https://example.com"
	// html_content, err := fetchHTML(url)

	htmlContent, err := os.ReadFile("test.txt")

	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	html_content := string(htmlContent)

	tree := buildDOMTree(html_content)

	printTree(tree, 0)
}
