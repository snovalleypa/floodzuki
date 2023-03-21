import React from "react"

interface IfProps {
  children: React.ReactNode
  condition: boolean | undefined
}

interface TernaryProps {
  children: [JSX.Element, JSX.Element]
  condition: boolean | undefined
}

export const If: React.FC<IfProps> = ({ children, condition }: IfProps): JSX.Element | null => {
  return condition ? <>{children}</> : null
}

export const Ternary: React.FC<TernaryProps> = ({ children, condition }: TernaryProps): JSX.Element => {
  return condition ? children[0] : children[1]
}
