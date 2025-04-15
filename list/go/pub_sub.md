# 用 go 写一个 sub 和 pub 的订阅模式，要求订阅者都接收到发送的消息

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Publisher struct {
	mu  sync.RWMutex
	sub map[string]chan string
}

func NewPublisher() *Publisher {
	return &Publisher{
		mu:  sync.RWMutex{},
		sub: make(map[string]chan string),
	}
}

func (p *Publisher) Subscribe(topic string) chan string {
	p.mu.Lock()
	defer p.mu.Unlock()

	ch := make(chan string)
	p.sub[topic] = ch
	return ch
}

func main() {
	p := NewPublisher()

	t1 := p.Subscribe("topic1")
	t2 := p.Subscribe("topic2")

	go func() {
		for {
			select {
			case msg := <-t1:
				fmt.Printf("topic1: %s", msg)
			}
		}
	}()

	go func() {
		for {
			select {
			case msg := <-t2:
				fmt.Printf("topic2: %s", msg)
			}
		}
	}()

	for {
		for _, v := range p.sub {
			v <- "Hello World!"
		}
		time.Sleep(time.Second)
	}
}

```
