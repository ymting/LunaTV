import { cloneElement, isValidElement, ReactNode } from 'react';

export default function NetflixCardFrame({
  children,
}: {
  children: ReactNode;
}) {
  // 将展示契约附加到已有卡片容器，经典布局和主题切换都不增加业务父节点。
  if (!isValidElement<{ className?: string }>(children)) return <>{children}</>;
  return cloneElement(children, {
    className: `${children.props.className || ''} netflix-card-frame`,
  });
}
