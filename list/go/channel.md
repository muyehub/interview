# Channel 底层实现

### 设计原理
Go 语言中的一条设计模式就是：不要通过共享内存来实现通信，而是应该通过通信来实现共享内存
在处理并发时，我们最直观的想法就是使用锁来保护共享内存，然而锁的使用会导致代码复杂度增加，容易出错并且效率大大降低。
这时候我们就需要一种无锁的数据结构来更高效的实现并发场景下的数据共享。

Go 语言社区在 2014 年就提出了无锁 Channel 的实现方案，该方案将 Channel 分成了以下三种类型：
同步 Channel-不需要缓冲区，也叫无缓冲 Channel，发送方会直接将数据发送给接收方。
异步 Channel-需要缓冲区，也叫有缓冲 Channel，基于环形缓存的传统生产者和消费者模型。
chan struct{} 类型的异步 Channel-struct{}类型不占用内存空间，不需要实现缓冲区和直接发送的语义。

### 数据结构
```Go
type hchan struct {
  qcount uint
  dataqsiz uint
  buf unsafe.Pointer
  elemsize uint16
  closed uint32
  elemtype *_type
  sendx uint
  recvx uint
  recvq waitq
  sendq waitq

  lock mutex
}
```
runtime.hchan 结构体中的 qcount、dataqsiz、buf、sendx、recvx 构建了底层的循环队列
qcount：Channel 中的元素个数, 当前环上元素数
dataqsiz：Channel 中循环队列的长度,环长
buf：Channel 的缓冲区数据指针
sendx：Channel 的发送操作处理到的位置
recvx：Channel 的接受操作处理到的位置

我们可以看到这个结构里有一个 lock 参数，说明也是用到锁的，那为什么 channel 还能那么快呢？它的无锁是怎么实现的？
其实这里使用了一种在并发编程中最常见的设计模式来解决这个问题，那就是快慢路径(fast-slow-path)，也就是在处理最常见的情况的时候使用快路径，在处理特殊情况的时候使用慢路径，通常是通过加锁去解决并发问题。
channel 中的这个就是，当有缓冲 channel 满/空的时候会触发慢路径，这时候就要用到结构体中的锁来保护数据了。
