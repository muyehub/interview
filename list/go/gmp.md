# 基本概念
GMP 是 golang 的一个调度器，主要用来负责调度多协程之间的协同工作，只要是涉及到多进程、多线程的工作，都需要调度器，linux 系统本身也会有自己的调度器。
这里说到的 GMP，其中的 G 是 goroutine 的意思，M 是 machine 的意思，P 是 processor 的意思。GMP 主要是用来调度 G 和 M 之间的工作。

