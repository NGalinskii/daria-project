declare module 'react-motion' {
  import { Component, type ReactElement } from 'react'

  export interface SpringConfig {
    stiffness?: number
    damping?: number
    precision?: number
  }

  export interface OpaqueConfig {
    val: number
    stiffness: number
    damping: number
    precision: number
  }

  export type Style = Record<string, number | OpaqueConfig>
  export type PlainStyle = Record<string, number>

  export function spring(value: number, config?: SpringConfig): OpaqueConfig

  export interface MotionProps {
    defaultStyle?: PlainStyle
    style: Style
    children: (interpolatedStyle: PlainStyle) => ReactElement
    onRest?: () => void
  }

  export class Motion extends Component<MotionProps> {}
}
