# 基本概念
GMP 是 golang 的一个调度器，主要用来负责调度多协程之间的协同工作，只要是涉及到多进程、多线程的工作，都需要调度器，linux 系统本身也会有自己的调度器。

这里说到的 GMP，其中的 G 是 goroutine 的意思，M 是 machine 的意思，P 是 processor 的意思。P 主要是用来调度 G 和 M 之间的工作。

其实在早期是没有 P 这个概念的，而是直接使用 M 来调度 G 的工作，也就是由操作系统线程去直接调度 G 的工作，假设由 10 个 M 来调度 1000 个 G 的工作，每次 M 去获取一个 G 执行的时候都要进行加锁的操作，防止同一个 G 被多个 M 同时获取到，这样子效率就会很低。

后来引入了 P 的概念，由 P 去直接调度 G 的工作，M 只负责执行 P 分配的 G 的工作，这样子就避免了 M 之间的竞争问题。P 和 M 之间是有一对多的关系，一个 P 可以对应多个 M，而一个 M 只能对应一个 P。
每个 P 都会维护一个本地队列，来存储 G 的工作，同时也会有一个全局队列当本地队列满了以后会从全局队列中拿取 G 的工作来执行。

golang 的调度器经过很多阶段的演变，分别是：

* 单线程调度器
* 多线程调度器
* 任务窃取调度器(引入 G-M-P)
* 抢占式调度器(现今)
* 非均匀存储访问调度器(提案)

抢占式调度器主要是为了解决两个问题

* 某些 Goroutine 可以长时间占用线程，造成其他 Goroutine 饥饿
* 垃圾收集需要暂停整个程序(STW)，最长可能需要几分钟的时间，导致整个程序无法工作。

抢占式调度器在发展中也经历了两个阶段

* 基于协作的抢占式调度(导致 STW 时间过长)
  这种方式依赖于协作式的调度，只有在 goroutine 主动让出 CPU 的时候，调度器才会进行调度，这种方式会导致 STW 时间过长，因为 goroutine 可能会执行时间过长或者for 的死循环之类的会长时间占用 CPU。
* 基于信号的抢占式调度
  Go 会启动一个 sysmon 监控线程执行后台监控任务，每隔一段时间就会检查全局 allp 数组，查看每个 P 上正在运行的 G 是否超时没让出 CPU，如果超时就会发送 SIGURG 信号给当前的 G，然后在“安全点”完成切换，换另一个 G 上来运行。这里的安全点是当程序执行到函数入口/返回、栈扩张、runtime 调用等。
  被强占的 G 会重新推到 P 的本地队列的队首保证下次优先执行，如果当前 P 的本地队列满了就会推到全局队列的队首。
  P 在正常的调度模式下会先从本地队列中拿 G 来执行，如果没有拿到就会从别的 P 上的尾部 steal 一个，如果 steal 也没抢到就会从全局队列中拿一个来执行
  这是正常的调度，但如果在饥饿模式下，某些 G 在全局队列中被“饿”了超过阈值(大概 20ms)，P 在下一次调度时就不会走上面的逻辑，而是直接先去全局队列取尽可能老的那批 G 来运行，哪怕 P 的本地队列中还有未执行的 G。
