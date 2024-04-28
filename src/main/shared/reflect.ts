/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata'

// 定义一个 metadata 用来收集所有的元数据
const _metadata = {}

export enum ChannelWay {
  RENDERER_TO_MAIN__ONE_WAY = 'RENDERER_TO_MAIN__ONE_WAY',
  RENDERER_TO_MAIN__TWO_WAY = 'RENDERER_TO_MAIN__TWO_WAY'
}
export function ServiceRegister(serviceName: string) {
  return (target: any) => {
    const targetName = target.name
    // 合并元数据
    const data = {
      service: serviceName, // 服务名称
      ...Reflect.getMetadata(`${targetName}`, _metadata)
    }
    // 更新元数据
    Reflect.defineMetadata(`${targetName}`, data, _metadata)
  }
}

export function ServiceHandler(channelWay?: ChannelWay) {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    const targetName = target.constructor.name
    // 合并元数据
    const data = {
      handle: descriptor.value, // 处理函数
      way: channelWay || ChannelWay.RENDERER_TO_MAIN__TWO_WAY,
      ...Reflect.getMetadata(`${targetName}`, _metadata)
    }
    // 更新元数据
    Reflect.defineMetadata(`${targetName}`, data, _metadata)
  }
}

export const getMetadata = (className: string) => Reflect.getMetadata(`${className}`, _metadata)
