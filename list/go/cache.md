# 设计一个简单的本地缓存，实现数据存取及数据过期清理策略
```Go
package main

import (
	"fmt"
	"strconv"
	"sync"
	"time"
)

type items struct {
	val    interface{}
	expire time.Time
}

type LocalCache struct {
	v map[string]items
	m sync.RWMutex
}

func NewCache() *LocalCache {
	return &LocalCache{
		v: make(map[string]items),
	}
}

func (c *LocalCache) Set(name string, val interface{}, expire time.Time) {
	c.m.Lock()
	defer c.m.Unlock()
	c.v[name] = items{
		val:    val,
		expire: expire,
	}
}

func (c *LocalCache) Get(name string) interface{} {
	c.m.RLock()
	defer c.m.RUnlock()
	if item, ok := c.v[name]; ok {
		if time.Now().Before(item.expire) {
			return item.val
		} else {
			c.Delete(name)
		}
	}
	return nil
}

func (c *LocalCache) Delete(name string) {
	delete(c.v, name)
}

// 线程安全
func main() {
	c := NewCache()
	ch := make(chan int)
	for i := 0; i <= 10; i++ {
		go func(i int) {
			c.Set("age"+strconv.Itoa(i), i, time.Now().Add(time.Second*5))
			// fmt.Printf("age %d\n", i)
			<-ch
		}(i)
	}
	// 等待所有goroutine完成
	for i := 0; i <= 10; i++ {
		ch <- 1
	}

	time.Sleep(time.Second * 4)

	var wg sync.WaitGroup
	for i := 0; i <= 10; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			res := c.Get("age" + strconv.Itoa(i))
			fmt.Printf("get age: %d\n", res)
		}(i)
	}
	wg.Wait()
	fmt.Println("end!!")
}

// 非线程安全缓存读写
// func main() {
// c := NewCache()
// c.Set("user", "{name:fy,age:18}", time.Now().Add(time.Second*8))
//
// res := c.Get("user")
// fmt.Printf("get 1: %s\n", res)
//
// time.Sleep(time.Second * 5)
//
// res = c.Get("user")
// fmt.Printf("get 2: %s\n", res)
//
// time.Sleep(time.Second * 5)
//
// res = c.Get("user")
// fmt.Printf("get 3: %s\n", res)
// }
```
