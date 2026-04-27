import React from "react";

interface IfProps {
  children: React.ReactNode;
  condition: boolean | undefined;
}

interface TernaryProps {
  children: [React.ReactElement, React.ReactElement];
  condition: boolean | undefined;
}

export const If: React.FC<IfProps> = ({
  children,
  condition,
}: IfProps): React.ReactElement | null => {
  return condition ? <>{children}</> : null;
};

export const Ternary: React.FC<TernaryProps> = ({
  children,
  condition,
}: TernaryProps): React.ReactElement => {
  return condition ? children[0] : children[1];
};
