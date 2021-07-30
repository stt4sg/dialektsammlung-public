import * as React from 'react';
import * as Modal from 'react-modal';
import { Button } from '../ui/ui';
import { CloseIcon } from '../ui/icons';

interface ButtonConfig {
  [name: string]: () => any;
}

export interface ModalProps {
  buttons?: ButtonConfig;
  children?: React.ReactNode;
  innerClassName?: string;
  className?: string;
  onRequestClose?: (event?: React.MouseEvent | React.KeyboardEvent) => any;
}

export const ModalButtons = (props: any) => <div className="buttons" {...props} />;

export default ({ buttons, children, className = '', innerClassName = '', ...props }: ModalProps) => (
  <Modal
    className={className}
    isOpen={true}
    contentLabel="modal"
    appElement={document.getElementById('root') as HTMLElement}
    {...props}
    style={{
      overlay: { background: 'rgba(0, 0, 0, 0.8)' },
      content: {
        padding: 0,
        background: 'transparent',
      },
    }}
    ariaHideApp={false}>
    <div className={'inner ' + innerClassName}>
      {props.onRequestClose && (
        <button type="button" className="close" onClick={props.onRequestClose as any}>
          <CloseIcon black />
        </button>
      )}
      {children}
      <ModalButtons>
        {buttons &&
          Object.keys(buttons).map(label => (
            <Button key={label} outline onClick={buttons[label] as any}>
              {label}
            </Button>
          ))}
      </ModalButtons>
    </div>
  </Modal>
);
