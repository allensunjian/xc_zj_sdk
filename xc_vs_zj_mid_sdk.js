import axios from "axios"

const axiosInstance = axios.create({
    baseURL: "/api",
    timeout: 10000,
    headers: {
        Authorization : `Bearer ${window.localStorage.getItem("_token")}`
    }
})

const install = (app) => {
    let proto = app.config.globalProperties || app.prototype;
    proto.initServer = initServer;
    mountedDirectives(app)
}
const STATE_SERVER = "_xcClientServer_";
const SERVER_INSTANCE = "__SERVER_INSTANCE__";
const STATE_CONNECTION = "connect_state";
const STATE_AWAIT = "awaitEvents";
const STATE_MEADIA = "media_state_map";
const STATE_MEADIA_INITED = "inited";
const STATE_VIDEO_OPEN = "video_opened";
const STATE_AUDIO_OPEN = "audio_opened";
const DATA_MEDIA_STREAM = "media_stream";
const DOM_MEDIA_CANVAS = "_xcSDKcanvas_";
const STATE_MEADIA_USEROPTS = "user_options";

const emotionState = {
    neutral: "平静",
    angry: "生气",
    confused: "困惑",
    contempt: "鄙视",
    disgust: "恶心",
    fear: "害怕",
    happy: "高兴",
    sad: "悲伤",
    surprise: "惊讶"
}

const apiAndFormatter = {
    // 情绪
    getEmotion: {
        api: "/train/emotion/emotibotServer",
        responesFormatter: (respones) => {
            const primary = respones.data.emotion;
            respones = { emotion: primary, emotionText: emotionState[primary] }
            return respones
        },
        paramsFormatter: (params) => {
            const formData = new FormData();
            formData.append("file", params, "image.jpg");
            formData.append("id", userOptions.userInfo.info.id);
            formData.append("type", userOptions.examinationType);
            formData.append("resultId", userOptions.resultId);
            return formData
        }
    },

    // 陪练结果 打分
    getResult: {
        api: "/train/result/complex-result",
        responesFormatter: (respones) => {
            // {
            //     "abilityModel" : {
            //       "affinityAbility" : 0,
            //       "languageAbility" : 0,
            //       "logicAbility" : 0,
            //       "reactionAbility" : 0,
            //       "skillAbility" : 0
            //     },
            //     "audioId" : "string",
            //     "audioQicRes" : {
            //       "fastSpeedDuration" : "string",
            //       "normalSpeedDuration" : "string",
            //       "silenceDuration" : "string",
            //       "silenceScore" : 0,
            //       "slowSpeedDuration" : "string",
            //       "speedTrendList" : [ {
            //         "speed" : 0,
            //         "time" : "string"
            //       } ],
            //       "speedTrendScore" : 0,
            //       "suggestList" : [ "string" ],
            //       "totalScore" : 0,
            //       "totalStaffSpeakTime" : "string"
            //     },
            //     "beatPercent" : 0,
            //     "complexScore" : 0,
            //     "normsSpeechRes" : {
            //       "dialogNodeList" : [ {
            //         "nodeName" : "string",
            //         "nodeType" : "string",
            //         "refSpeech" : "string",
            //         "ruleList" : [ {
            //           "refSpeech" : "string",
            //           "ruleName" : "string",
            //           "ruleType" : "string",
            //           "score" : 0,
            //           "valid" : true
            //         } ],
            //         "score" : 0,
            //         "yourAnswer" : "string"
            //       } ],
            //       "dialogNodescore" : 0,
            //       "normsSpeechScore" : 0,
            //       "sensitiveWordList" : [ {
            //         "name" : "string",
            //         "score" : 0,
            //         "valid" : true
            //       } ],
            //       "sensitiveWordScore" : 0,
            //       "suggestList" : [ "string" ]
            //     },
            //     "responseBean" : {
            //       "emotionControlScore" : 0,
            //       "emotionList" : [ {
            //         "name" : "string"
            //       } ],
            //       "emotionPercentList" : [ {
            //         "name" : "string",
            //         "percent" : "string"
            //       } ],
            //       "emotionProportionScore" : 0,
            //       "emotionTreeList" : [ {
            //         "data" : [ "string" ],
            //         "name" : "string"
            //       } ],
            //       "propose" : [ "string" ],
            //       "timeList" : [ 0 ],
            //       "totalScore" : 0
            //     },
            //     "segmentList" : [ {
            //       "asr_text" : "string",
            //       "emotion" : [ "string" ],
            //       "end_time" : 0.0,
            //       "segment_id" : 0,
            //       "sent_id" : 0,
            //       "speaker" : "string",
            //       "start_time" : 0.0,
            //       "status" : 0
            //     } ]
            //   }
            return respones
        },
        paramsFormatter: (params) => {
            // {
            //     "callId" : "string",
            //     "courseName" : "string",
            //     "resultId" : 0,
            //     "resultType" : 0,
            //     "userUuid" : "string"
            //   }
            return params
        }
    }
}

const RES_CALLBACK = []

const CATCH_CALLBACK = []

const audioJS = {
    addWavHeader(samples, sampleRateTmp, sampleBits, channelCount) {
        const dataLength = samples.byteLength;
        /* 新的buffer类，预留44bytes的heaer空间 */
        const buffer = new ArrayBuffer(44 + dataLength);
        /* 转为 Dataview, 利用API来填充字节 */
        const view = new DataView(buffer);
        let offset = 0;
        /* ChunkID, 4 bytes,  资源交换文件标识符 */
        this.writeString(view, offset, 'RIFF'); offset += 4;
        /* ChunkSize, 4 bytes, 下个地址开始到文件尾总字节数,即文件大小-8 */
        view.setUint32(offset, /* 32 */ 36 + dataLength, true); offset += 4;
        /* Format, 4 bytes, WAV文件标志 */
        this.writeString(view, offset, 'WAVE'); offset += 4;
        /* Subchunk1 ID, 4 bytes, 波形格式标志 */
        this.writeString(view, offset, 'fmt '); offset += 4;
        /* Subchunk1 Size, 4 bytes, 过滤字节,一般为 0x10 = 16 */
        view.setUint32(offset, 16, true); offset += 4;
        /* Audio Format, 2 bytes, 格式类别 (PCM形式采样数据) */
        view.setUint16(offset, 1, true); offset += 2;
        /* Num Channels, 2 bytes,  通道数 */
        view.setUint16(offset, channelCount, true); offset += 2;
        /* SampleRate, 4 bytes, 采样率,每秒样本数,表示每个通道的播放速度 */
        view.setUint32(offset, sampleRateTmp, true); offset += 4;
        /* ByteRate, 4 bytes, 波形数据传输率 (每秒平均字节数) 通道数×每秒数据位数×每样本数据位/8 */
        view.setUint32(offset, sampleRateTmp * channelCount * (sampleBits / 8), true); offset += 4;
        /* BlockAlign, 2 bytes, 快数据调整数 采样一次占用字节数 通道数×每样本的数据位数/8 */
        view.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2;
        /* BitsPerSample, 2 bytes, 每样本数据位数 */
        view.setUint16(offset, sampleBits, true); offset += 2;
        /* Subchunk2 ID, 4 bytes, 数据标识符 */
        this.writeString(view, offset, 'data'); offset += 4;
        /* Subchunk2 Size, 4 bytes, 采样数据总数,即数据总大小-44 */
        view.setUint32(offset, dataLength, true); offset += 4;
        if (sampleBits === 16) {
            this.floatTo16BitPCM(view, samples);
        } else if (sampleBits === 8) {
            this.floatTo8BitPCM(view, samples);
        } else {
            this.floatTo32BitPCM(view, samples);
        }
        return new Blob([view], { type: 'audio/wav' });
    },
    floatTo32BitPCM(output, input) {
        const oinput = new Int32Array(input);
        let newoffset = 44;
        for (let i = 0; i < oinput.length; i += 1, newoffset += 4) {
            output.setInt32(newoffset, oinput[i], true);
        }
    },
    floatTo16BitPCM(output, input) {
        const oinput = new Int16Array(input);
        let newoffset = 44;
        for (let i = 0; i < oinput.length; i += 1, newoffset += 2) {
            output.setInt16(newoffset, oinput[i], true);
        }
    },
    floatTo8BitPCM(output, input) {
        const oinput = new Int8Array(input);
        let newoffset = 44;
        for (let i = 0; i < oinput.length; i += 1, newoffset += 1) {
            output.setInt8(newoffset, oinput[i], true);
        }
    },
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i += 1) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    },
    audioData(context, config) {
        return {
            size: 0,
            //  录音文件长度
            buffer: [],
            //  录音缓存
            inputSampleRate: context.sampleRate,
            //  输入采样率
            inputSampleBits: 16,
            //  输入采样数位 8, 16
            outputSampleRate: config.sampleRate,
            //  输出采样率
            oututSampleBits: config.sampleBits,
            //  输出采样数位 8, 16
            clear() {
                this.buffer = [];
                this.size = 0;
            },
            input(data) {
                this.buffer.push(new Float32Array(data));
                this.size += data.length;
            },
            compress() {
                //  合并压缩
                //  合并
                const data = new Float32Array(this.size);
                let offset = 0;
                for (let i = 0; i < this.buffer.length; i += 1) {
                    data.set(this.buffer[i], offset);
                    offset += this.buffer[i].length;
                }
                //  压缩
                const compression = parseInt(this.inputSampleRate / this.outputSampleRate, 10);
                const length = data.length / compression;
                const result = new Float32Array(length);
                let index = 0;
                let j = 0;
                while (index < length) {
                    result[index] = data[j];
                    j += compression;
                    index += 1;
                }
                return result;
            },
            encodeWAV() {
                const sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
                const sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
                const bytes = this.compress();
                const dataLength = bytes.length * (sampleBits / 8);
                const buffer = new ArrayBuffer(44 + dataLength);
                const data = new DataView(buffer);
                const channelCount = 1;
                //  单声道
                let offset = 0;
                const writeString = (str) => {
                    for (let i = 0; i < str.length; i += 1) {
                        data.setUint8(offset + i, str.charCodeAt(i));
                    }
                };
                // 资源交换文件标识符
                writeString('RIFF'); offset += 4;
                // 下个地址开始到文件尾总字节数,即文件大小-8
                data.setUint32(offset, 36 + dataLength, true); offset += 4;
                // WAV文件标志
                writeString('WAVE'); offset += 4;
                // 波形格式标志
                writeString('fmt '); offset += 4;
                // 过滤字节,一般为 0x10 = 16
                data.setUint32(offset, 16, true); offset += 4;
                // 格式类别 (PCM形式采样数据)
                data.setUint16(offset, 1, true); offset += 2;
                // 通道数
                data.setUint16(offset, channelCount, true); offset += 2;
                // 采样率,每秒样本数,表示每个通道的播放速度
                data.setUint32(offset, sampleRate, true); offset += 4;
                // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
                data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true); offset += 4;
                // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
                data.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2;
                // 每样本数据位数
                data.setUint16(offset, sampleBits, true); offset += 2;
                // 数据标识符
                writeString('data'); offset += 4;
                // 采样数据总数,即数据总大小-44
                data.setUint32(offset, dataLength, true); offset += 4;
                // 写入采样数据
                if (sampleBits === 8) {
                    for (let i = 0; i < bytes.length; i += 1, offset += 1) {
                        const s = Math.max(-1, Math.min(1, bytes[i]));
                        let val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        val = parseInt(255 / (65535 / (val + 32768)), 10);
                        data.setInt8(offset, val, true);
                    }
                } else {
                    for (let i = 0; i < bytes.length; i += 1, offset += 2) {
                        const s = Math.max(-1, Math.min(1, bytes[i]));
                        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }
                return new Blob([data], { type: 'audio/wav' });
            },
        };
    }
}

const mountedDirectives = (app) => app.directive("stream", initUserDeviceStream)

const GETSERVER = () => window[STATE_SERVER];

const STATE_MAP = {
    use: false, // 是否设置拦截器
};

const midbag = (methodFn) => (apiAndFormatter, moduleName) => (data, options) => {
    const orMatter = apiAndFormatter[moduleName];
    methodFn.apply(null, [orMatter.api, orMatter.paramsFormatter(data), options])
        .then(respones => UTILS.events.respones_notify(moduleName, orMatter.responesFormatter(respones)))
        .catch(mistake => UTILS.events.catch_notify(UTILS_PART.mistake_interface(moduleName, mistake)))
}

const post = midbag(axiosInstance.post);

const get = midbag(axiosInstance.get);

const _respones_notify = (type, res) => RES_CALLBACK.forEach(fn => fn({
    type, res
}, UTILS_PART));

const UTILS = {
    host: {
        _getHostHead() {
            return (location.protocol === 'https:' ? 'wss' : 'ws') + "://"
        },

    },
    server: {
        getServerInstance: () => window[SERVER_INSTANCE],
        hasInstance: () => Boolean(window[SERVER_INSTANCE]),
        setServerInstance: (serverInstance) => {
            window[SERVER_INSTANCE] = serverInstance;
            return serverInstance
        },
        save: (ws) => {
            let server = GETSERVER();
            server.ws_server = ws;
        },
        setState: (val) => {
            let server = GETSERVER()
            server[STATE_CONNECTION] = val;
        },
        getState: () => {
            let server = GETSERVER()
            return server[STATE_CONNECTION]
        },
        send: (msg) => {
            let server = GETSERVER();
            server.ws_server.send(msg)
        },
        addAwait: (cb) => {
            let server = GETSERVER();
            server[STATE_AWAIT].push(cb)
        },
        getAwaitQueue: () => {
            let server = GETSERVER();
            return server[STATE_AWAIT]
        },
        AwaitQueue_clear: () => {
            let server = GETSERVER();
            server[STATE_AWAIT] = []
        },
        close: (state) => {
            let server = GETSERVER();
            server[STATE_AWAIT] = [];
            server.ws_server.close();
            server[STATE_CONNECTION] = state || 0;
        }
    },
    events: (() => {
        const LAB = {};
        return {
            add: (key, fn) => LAB[key] = fn,
            remove: (key) => delete LAB[key],
            notify: (key) => (...argus) => LAB[key] && LAB[key].apply(null, argus),
            allNotify: (msg) => LAB.forEach(fn => fn(msg)),
            await_notify: () => {
                let queue = UTILS.server.getAwaitQueue();
                queue.forEach(fn => fn());
                UTILS.server.AwaitQueue_clear();
            },
            $mount: (server) => {
                //let notify = UTILS.events.notify;
                server.onmessage = (msg) => {
                    let resultIdIdx = -1;
                    if (typeof msg.data == "string") resultIdIdx = msg.data.indexOf("resultId");

                    // 私有化resultIdIdx
                    if (resultIdIdx >= 0) {
                        UTILS.events.setUserOption("resultId", UTILS_PART.parse(msg.data).resultId);
                    }
                    if (STATE_MAP.use) {
                        STATE_MAP.useInjector(msg, UTILS.events.eventPatch(msg), UTILS_PART);
                        return
                    }
                    UTILS.events.allNotify(msg)
                }
                server.onclose = () => UTILS.events.catch_notify(UTILS_PART.mistake_interface("serverEvent", "server closed"))
                window.onunload = () => {
                    let server = GETSERVER();
                    server.server.close();
                    UTILS.server.setState(-3);
                }
            },
            eventPatch: (msg) => (key, data) => {
                UTILS.events.notify(key)(data || msg)
            },
            send: (msg) => {
                if (UTILS.server.getState() == 1) {
                    UTILS.server.send(msg)
                } else {
                    UTILS.server.addAwait(((m) => () => UTILS.server.send(m))(msg))
                }
            },
            respones: (responesCallback) => {
                RES_CALLBACK.push(responesCallback)
            },
            respones_notify: (type, res) => {
                _respones_notify(type, res)
            },
            catch_notify: (mistake) => CATCH_CALLBACK.forEach(fn => fn(mistake)),
            setUserOption: (key, val) => userOptions[key] = val
        }
    })(),
    use: (useInjector) => {
        STATE_MAP.use = true;
        STATE_MAP.useInjector = useInjector;
    },
    media: {
        getMediaInfo: () => window[STATE_MEADIA],
        setMediaInfo: (key, val) => UTILS.media.getMediaInfo()[key] = val,
        getMediaStateDetail: function (key) {
            let mediaDeviceState = UTILS.media.getMediaInfo();
            return mediaDeviceState[key]
        }
    },
    request: {
        post,
        getEmotion: post(apiAndFormatter, "getEmotion"),
        getResult: () => {
            UTILS.server.getServerInstance().closeConnect()
            return get(apiAndFormatter, "getResult")
        }
    }
}

const UTILS_PART = {
    parse: JSON.parse,
    stingify: JSON.stringify,
    deepCopy: (o) => UTILS_PART.parse(UTILS_PART.stingify(o)),
    getPhotoFromVideo: (video) => {
        return new Promise((resolve, reject) => {
            let canvas = document.getElementById(DOM_MEDIA_CANVAS)
            if (!document.getElementById(DOM_MEDIA_CANVAS)) {
                canvas = document.createElement("canvas");
                canvas.setAttribute("id", DOM_MEDIA_CANVAS);
            };
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, 160, 160);
            canvas.toBlob(
                (blob) => resolve(blob),
                "image/jpeg",
                0.95
            );
        })

    },
    creatForm: (objectForm) => {
        const Form = new FormData();
        Object.keys(objectForm).forEach(key => {
            let data = objectForm[key];
            let type = !data ? data : data.type;
            if (type) {
                Form.append(key, data.dataFile.res, type)
            } else {
                Form.append(key, data)
            }
        });
        return Form
    },
    mistake_interface: (errType, errInfo) => ({ errType, errInfo }),
    request_value_interface: (type, value) => ({ type, value }),
    readEncodeToObjectSrc: (encode) => {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.readAsArrayBuffer(encode);
                reader.onload = (e) => {
                    const bufer = e.srcElement.result;
                    //const blob = audioJS.addWavHeader(bufer, 16000, 16, 1);
                    const blob = new Blob([bufer],  { type: 'audio/wav' })
                    resolve(window.URL.createObjectURL(blob))
                };
            } catch (error) {
                reject(error)
            }

        })
    },
    getTime () {
        return new Date().getTime()
    }
};

window.UTILS_PART = UTILS_PART;

let FragmentConfig = {};
// to Fragment Change
const callbackFragment = (key, val, orignObj) => {
    if (key === STATE_CONNECTION) {
        val == 1 && UTILS.events.await_notify();
    }
    if (key === "timer" && val == null) clearInterval(orignObj[key]);

    orignObj[key] = val;

    return true

}

const _default_state_proxy = (proxyObj) => {
    return new Proxy(proxyObj, {
        set: (orignObj, key, val) => {
            if (orignObj[key] === val) return true;
            return callbackFragment(key, val, orignObj)
        }
    })
};

const _initFragmentConfig = () => {
    FragmentConfig = {};
    return { addFragment }
}

const addFragment = (key, fn) => {
    FragmentConfig[key] = fn;
    return { addFragment }
}

const _initServerLib = () => {
    let proxyObj = {
        ws_server: null,
        url: "",
        host: "",
        [STATE_CONNECTION]: 0, // 0 未连接, 1 连接成功， -1 连接失败 ， -2 连接成功之后异常断开, -3主动断开
        [STATE_AWAIT]: [],
    };
    window[STATE_SERVER] = _default_state_proxy(proxyObj)
}

const userOptions = _default_state_proxy({
    resultId: 0,
    resultType: "", // test 0 | examination 1 | testHistory 0 | examinationHistory 1
    examinationType: 0, // 考试类型 0 练习 1考试
    userInfo: {}
});

const ConnectStateChange = () => {
    console.log("链接状态改变")
}

const OPEN = (resolve) => () => {
    UTILS.server.setState(1);
    resolve("ws already connected");
}

const setServerURl = (url) => {
    const SERVER = GETSERVER();
    if (!url) return { url: setServerURl }
    SERVER.url = url;
    if (!SERVER.host) return { host: setServerHost }
    return initServer(url)
}

const setServerHost = (host) => {
    const SERVER = GETSERVER();
    if (!host) return { host: setServerHost }
    SERVER.host = host;
    if (!SERVER.url) return { url: setServerURl }
    return initServer(url)
}

const ServerConnect = () => {

    return new Promise((resolve, reject) => {
        const SERVER = GETSERVER();
        const ClientServer = new WebSocket(SERVER.host + SERVER.url);
        ClientServer.onopen = OPEN(resolve);
        UTILS.events.$mount(ClientServer);
        UTILS.server.save(ClientServer);
    })
}
let recordStartTime = null;

const initServer = (host, url) => {
    const SERVER = GETSERVER();
    // 返回单例
    if (UTILS.server.hasInstance()) return UTILS.server.getServerInstance()
    if (!SERVER.host) return { host: setServerHost }
    if (!SERVER.url) return { url: setServerURl };
    _initFragmentConfig().addFragment(STATE_CONNECTION, ConnectStateChange);
    let deviceInfo = UTILS.media.getMediaInfo();
    return UTILS.server.setServerInstance({
        ServerConnect,
        register: UTILS.events.add,
        remove: UTILS.events.remove,
        use: UTILS.use,
        send: UTILS.events.send,
        close: UTILS.server.close,
        respones: UTILS.events.respones,
        startRecorderAudio: start.bind(deviceInfo),
        stopRecorderAudio: (fn) => {
            let blob = getBlob.call(deviceInfo);
            fn({blob, recordStartTime, recordEndTime: UTILS_PART.getTime()}, () => UTILS.events.send(blob))
            clear.call(deviceInfo)
            stop.call(deviceInfo);
            recordStartTime = null;
        },
        setUser: (userInfo) => {
            userOptions.userInfo = userInfo;
            window.localStorage.setItem("_token", userInfo.token)
        },
        setResultType: (type) => userOptions.resultType = type,
        setExaminationType: (type) => userOptions.examinationType = type,
        catch: (catchCallback) => CATCH_CALLBACK.push(catchCallback),
        closeVideo: () => {
            let video_opened = UTILS.media.getMediaStateDetail(STATE_VIDEO_OPEN);;
            let videoStreamTracks = null;
            if (video_opened) {
                let mediaStream = UTILS.media.getMediaStateDetail(DATA_MEDIA_STREAM);
                videoStreamTracks = mediaStream.getTracks().find(o => o.kind == "video");
            }

            let errList = null;

            if (!video_opened) {
                errList = ["closeVideo", "video has been closed before handle close video"]
            } else if (!videoStreamTracks) {
                errList = ["closeVideo", "cannot found video stream"]
            }

            if (!errList) {
                videoStreamTracks.stop();
                UTILS.media.setMediaInfo(STATE_VIDEO_OPEN, false)
            } else {
                UTILS.events.catch_notify(UTILS_PART.mistake_interface.apply(null, errList))
            }
        },
        closeAudio: () => {
            let audio_opened = UTILS.media.getMediaStateDetail(STATE_AUDIO_OPEN);
            let mediaStream = null;
            let audioStreamTracks = null;
            if (audio_opened) {
                mediaStream = UTILS.media.getMediaStateDetail(DATA_MEDIA_STREAM);
                audioStreamTracks = mediaStream.getTracks().find(o => o.kind == "audio");
            }

            let errList = null;

            if (!audio_opened) {
                errList = ["closeAudio", "audio has been closed before handle close video"]
            } else if (!audioStreamTracks) {
                errList = ["closeAudio", "cannot found audio stream"]
            }

            if (!errList) {
                audioStreamTracks.stop();
                UTILS.media.setMediaInfo(STATE_AUDIO_OPEN, false)
            } else {
                UTILS.events.catch_notify(UTILS_PART.mistake_interface.apply(null, errList))
            }
        },
        closeConnect: function () {
            this.closeVideo();
            this.closeAudio();
            this.close(-3);
            let timer = UTILS.media.getMediaStateDetail("timer")
            UTILS.media.setMediaInfo("timer", null);
            clearInterval(timer)
        },
        getResult: UTILS.request.getResult
    })
}



// 视频设备相关
const initMediaState = () => {
    window[STATE_MEADIA] = _default_state_proxy({
        [STATE_VIDEO_OPEN]: false,
        [STATE_AUDIO_OPEN]: false,
        [DATA_MEDIA_STREAM]: null,
        [STATE_MEADIA_INITED]: false,
        [STATE_MEADIA_USEROPTS]: {
            videoOpts: {
                monitoring: false,
                dely: 2000,
                timer: null
            }
        },
        target: null,
        option: {},
        audioContext: null,
        audioInput: null,
        recorder: null,
        audioData: null,
        timer: null
    })
}

const initUserDeviceStream = ($el, option) => {
    if (!option) return;
    UTILS.media.setMediaInfo("target", $el)
    UTILS.media.setMediaInfo("option", UTILS_PART.deepCopy(option))
    //if (UTILS.server.getState() == 0) return;
    // EL = OPTION = null;
    // if (!UTILS.media.getMediaInfo()[STATE_MEADIA_INITED]) {
    //     UTILS.media.setMediaInfo(STATE_MEADIA_INITED, true)
    // }
    let opts = option.value;
    let mediaOpts = {
        video: opts.video,
        audio: opts.audio
    };
    let userOpts = {
        videoOpts: UTILS_PART.deepCopy(opts.videoOpts || {})
    }

    navigator.mediaDevices.getUserMedia(mediaOpts).then(stream => {
        opts.video && UTILS.media.setMediaInfo(STATE_VIDEO_OPEN, true);
        opts.audio && UTILS.media.setMediaInfo(STATE_AUDIO_OPEN, true);
        UTILS.media.setMediaInfo(DATA_MEDIA_STREAM, stream);
        UTILS.media.setMediaInfo(STATE_MEADIA_INITED, true);
        if (opts.video) {
            $el.srcObject = stream;
            $el.play();
        }
        if (opts.audio) {
            initRecorde.call(UTILS.media.getMediaInfo(), stream)
        }
        if (userOpts.videoOpts.monitoring) {
            if (UTILS.media.getMediaStateDetail("timer")) return;
            //clearInterval(UTILS.media.getMediaInfo(STATE_MEADIA_USEROPTS));
            //UTILS.media.setMediaInfo(STATE_MEADIA_USEROPTS, null);
            let timer = userOptions.delyTimer = analysisVideoFragment($el, userOpts)
            UTILS.media.setMediaInfo("timer", timer)
        }
    })
}

const initRecorde = function (stream) {
    const config = {};
    config.sampleBits = config.smapleBits || 16;
    config.sampleRate = config.sampleRate || 44100 / 2;
    this.audioContext = new AudioContext();
    this.audioInput = this.audioContext.createMediaStreamSource(stream);
    this.recorder = this.audioContext.createScriptProcessor(4096, 1, 1);
    (this.audioData = audioJS.audioData(this.audioContext, config)),
        (this.recorder.onaudioprocess = (e) => {
            this.audioData.input(e.inputBuffer.getChannelData(0));
        });
};

const start = function () {
    if (!this.audio_opened) {
        UTILS.events.catch_notify(UTILS_PART.mistake_interface("audioRecorderError", "recorder cannot connect before  audio stream inited"));
        return
    }
    recordStartTime = UTILS_PART.getTime();
    _respones_notify("audioRecorder", "aduio recorder start")
    this.audioInput.connect(this.recorder);
    this.recorder.connect(this.audioContext.destination);
}

const stop = function () {
    if (!this.audio_opened) {
        UTILS.events.catch_notify(UTILS_PART.mistake_interface("audioRecorderError", "recorder cannot connect before  audio stream inited"));
        return
    }
    _respones_notify("audioRecorder", "aduio recorder stop")
    this.audioInput.disconnect(this.recorder);
    this.recorder.disconnect();
}

const getBlob = function () {
    return this.audioData.encodeWAV();
}

const clear = function () {
    this.audioData.clear();
}

// 视频分析，按dely间隔进行
const analysisVideoFragment = (video, option) => {
    let timer = setInterval(() => {
        if (GETSERVER()[STATE_CONNECTION] == 0) return;
        if (!userOptions.resultId) return;
        UTILS_PART.getPhotoFromVideo(video).then(bolb => {
            UTILS.events.respones_notify("monitor", bolb)
            UTILS.request.getEmotion(bolb, { headers: { "Content-Type": "multipart/form-data" } })
        })
    }, option.videoOpts.dely || 1000);
    return timer
}
_initServerLib();
initMediaState();

export default { install }