#### 对接竹间符合业务场景的自研SDK

- 开始使用
说明：开始视频监测方法
main.js
```
...
import zjSDK from "../xc_vs_zj_mid_sdk/xc_vs_zj_mid_sdk"
...

Vue.use(zjSDK);
...
```
test.vue
```
<template>
    <div class="zjText__view">
        <video v-stream="options">
        </video>   
    </div> 
</template>
<script>'
    export default {
        data: function () {
            return {
                options: {
                video: true, // 是否开启视频
                audio: true, // 是否开启音频
                videoOpts: {  // 视频设置 
                    monitoring: false,  //是否开始 情绪监测
                    dely: 2000 // 监测频率
                    },
                }
            }
        }
    }
</script>  
```
当视频监测开启完毕之后， 我们会发现 摄像头会自动被打开， 但这时候还无法进行数据的交互， 因为还没有初始化服务

- 服务的初始化
说明：服务是独立创建的
test.vue
```
<template>
    <div class="zjText__view">
        <video v-stream="options">
        </video>   
    </div> 
</template>
<script>'
    export default {
        data: function () {
            return {
                Server: null,
                options: {
                    video: true, // 是否开启视频
                    audio: true, // 是否开启音频
                    videoOpts: {  // 视频设置 
                        monitoring: false,  //是否开始 情绪监测
                        dely: 2000 // 监测频率
                    },
                }
            }
        },
        methods: {
            createServer () {
                // 创建一个服务，到这一步， 一个ws服务链接就配置好了
                this.Server = this.initServer()
                .host("wss://localhost:16000")
                .url(
                    `/websocketpc/${"0ee990922a9848ca9dc8221c5dde6058"}/${1}/${3}/${0}/${this.callId}`
                    );

                // 进行服务的连接    
                this.Server.ServerConnect().then(res => console.log("连接成功啦")).catch(err => console.log("连接出了一点问题"))

                // 监听和拦截服务消息
                // 消息拦截方法是 所有 服务器返回消息的汇总
                this.Server.use((event) => {
                    // event 服务器返回的消息
                })
                //---在当前场景下，竹间提供的 服务 返回的消息的类型是多种的， 那么在use方法内去做数据的判断和处理逻辑是十分冗余的。
                
                // patch 和 utils 方法 来派发和处理数据
                this.Server.use((event, patch, utils) => {
                    // patch 派发数据中转到指定的 方法下
                    // utils 提供多种处理数据的简便方法
                    if (typeof event == "string") {
                        // 满足条件后 把event返回值 派发到message方法
                        // 这时候我们还没有message方法， 那么我们需要创建一个
                        patch("message", event)
                    }
                })

                // 注册message方法
                this.Server.register("message", msg => {
                    // msg 即 上文中 patch过来的event
                    console.log(msg)
                })
                // 你可以使用register注册任意多个事件

                // use.patch 和 register 的配合 可以形成 灵活的数据处理解决方案。使代码看起来更清晰，更易于读懂
                
            }
        }
    }
</script>  
```

- 开始与服务器进行数据交互

目前与服务器进行数据交互的方式 分为 文字 和 语音两种。
```
...
 methods: {
            createServer () {
                // 创建一个服务，到这一步， 一个ws服务链接就配置好了
                this.Server = this.initServer()
                .host("wss://localhost:16000")
                .url(
                    `/websocketpc/${"0ee990922a9848ca9dc8221c5dde6058"}/${1}/${3}/${0}/${this.callId}`
                    );

                 // 向服务器发送一条文字
                 this.Server.send("这是一条文字")

                 // 发送一条语音 
                 // 语音的发送是特殊的， 因为需要有录制与停止录制的过程‘

                 // 开始录音
                 this.Server.startRecorderAudio();
                 //停止录音
                 this.Server.stopRecorderAudio();
                 // 一个 开始、一个 停止 就解决了 语音的录制并发送给服务器的交互过程

            }
        }
...
```

- 接收服务器的返回值（非ws）

```
this.Server.respones((data, utils) => {
    @params {data} {type, res} 
    @utils 工具类
})
// 说明： 为什么有了.use方法 还要有 .respones 方法 他们的区别是什么？
// .use 方法的主要体现在监测， 他是监测 服务器主动 推送的消息， 也就是它对应的是ws服务
// .respones 方法主要体现在回调事件， 它是SDK主动请求结果的回调。也就是对应的常规的http请求 而非 长链接
// 对应的场景见最后 特别说明
```

- 全局错误的处理

```
// 该方法 可以 拦截到全局的任何错误
this.Server.catch(err => {
    console.log(err)
})

```

- 权限设置相关

```
// 设置返回值类型
this.Server.setResultType(0) // 根据竹间 目前提供的 分为：0: test | 1: examination | 0： testHistory | 1： examinationHistory

// 设置用户信息
// 这里主要是针对竹间可能增加的权限信息做的 扩展
// 目前还处于未与竹简对接的状态 所以这里先预留出接口
this.Server.setUser({
    id: null,
    name: null
})
```


- 特别说明与扩展用法
说明： 对于目前我所考虑到的对接场景， 以上的API 应该够用了， 但是为了以防万一， 还是做了一些工作来保证生产场景下 尽可能灵活

###### 对视频流的详细说明
```
// 开篇第一块 就针对视频流的创建进行了简要的使用说明， 现在我们来深入了解它
// 对于video标签上我们只要使用v-stream指令即可
// 我们主要探讨的是对Options的配置和使用

// 针对 业务场景下 options 的配置是简单的

{
    video: true,
    audio: true,
    videoOpts: { monitoring: true, dely: 2000 },
}
// 即可满足

对于特殊的场景， 对video和audio有特殊的需求， 我们可以这样做
- 指定视频分辨率
{
    video: { width: 1280, height: 720 }, //指定使用1280*720分辨率  
    audio: true
}

- 指定获取的最低分辨率
{
    video: { width: {min: 1280}, height: {min: 720} }, //指定最小使用1280*720
    audio: true
}

- 指定帧率
{
    video: { frameRate：{ ideal: 10, max: 15 } }, //ideal理想值 max最大值
    audio: true
}

```

###### 关闭

```
// 完全关闭连接 包括媒体流
this.Server.closeConnect()
```

```
// 关闭视频流
this.Server.closeVideo()
```

```
// 关闭音频流
this.Server.closeAudio()
```

###### 移除事件
```
// 用于函数时变成下使用register注册的事件
this.Server.remove(eventName)
```

###### utils提供的支持函数
- parse                 @params{jsonstring} return object
- stingify              @params{object} return jsonstring
- deepCopy              @params{object} return single object
- getPhotoFromVideo     @params{videoElement} return blob
- creatForm             @params{object} object{key:val} return formData
- readEncodeToObjectSrc @params{encode} return Promise thenable -> ObjectURL

##### Server.respones 返回值详解
const type = data.type;

type: "getEmotion" 返回情绪信息 
...待对接完善

##### 陪练WS接口以及返回值
```
/*
 * 参数说明：
 * @params {userUuid} 用户ID
 * @params {groupId} 课程组ID
 * @params {courseId} 课程id
 * @params {resultType} 对练类型 0 练习 | 1 考试
 * @params {callId} 会话ID （默认前端传null）
 */
 
WS: ws://ip:31189/trainning/speech/{userUuid}/{groupId}/{courseId}/{resultType}/{callId}

respones

{
    "asrText":"喂。" //asr转义文本,
    "audioId":"8k_stu_a989ae5044d44d39ae5785855117512c46c6f624-0492-4e8b-8b09-d5ddd3993aab" //录音id,
    "callId":"a989ae5044d44d39ae5785855117512c" //会话id,
    "direction":0, //角色 1:客户 0:坐席
    "end":false, //是否结束
    "resultId":348, //对练记录id
    "sensitiveWordList":[ ], //敏感词 目前有一个傻瓜
    "speed":86,//语速
}

```
###### 陪练结果
```

```





