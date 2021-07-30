import { Localized } from '@fluent/react';
import * as React from 'react';
import { HTMLProps, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { LocaleLink } from '../locale-helpers';
import { CheckIcon, CloudIcon } from './icons';
import { Tooltip } from 'react-tippy';

export const Avatar = ({ className, url, style }: { url?: string; className?: string; style?: object }) => (
  <div className={`avatar-wrap ${className ? className : ''}`} style={style}>
    {url ? (
      <img src={url} />
    ) : (
      <img className="mars-avatar" src={require('./icons/mars-avatar.svg')} alt="Robot Avatar" />
    )}
  </div>
);

export const Button = ({ className = '', outline = false, rounded = false, ...props }) => (
  <button
    type="button"
    className={['button', outline ? 'outline' : '', rounded ? 'rounded' : '', className].join(' ')}
    {...props}
  />
);

export const CardAction = ({ className, ...props }: any) =>
  props.to ? (
    <LocaleLink className={'card-action ' + className} {...props} />
  ) : (
    <Button outline className={'card-action ' + className} {...props} />
  );

export const Hr = (props: any) => <hr className="hr" {...props} />;

export const Checkbox = React.forwardRef(
  (props: HTMLProps<HTMLInputElement>, ref: React.RefObject<HTMLInputElement>) => (
    <span className="checkbox-container">
      <input ref={ref} type="checkbox" {...props} />
      <CheckIcon className="checkmark" />
    </span>
  )
);

export const LabeledCheckbox = React.forwardRef(({ label, style, ...props }: any, ref) => (
  <label className="labeled-checkbox" style={style}>
    <Checkbox ref={ref} {...props} />
    <span className="label">{label}</span>
  </label>
));

const LabeledFormControl = React.forwardRef(
  ({ className = '', component: Component, label, required, showHelpIcon, ...props }: any, ref) => {
    const { title, ...rest } = props;

    const child = <Component {...{ ref, required }} {...rest} />;
    return (
      <label
        className={['labeled-form-control', 'for-' + Component, className, props.disabled ? 'disabled' : ''].join(' ')}
        {...rest}>
        <span className="label" style={{ display: 'flex', alignItems: 'center' }}>
          {required && '*'}
          {label}
          {showHelpIcon == true && (
            <>
              <Tooltip arrow title={props.title}>
                <svg viewBox="0 0 24 24" style={{ marginLeft: '5px', width: '18px', height: '18px', fill: '#4a4a4a' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"></path>
                </svg>
              </Tooltip>
            </>
          )}
        </span>
        {Component == 'select' ? <div className="wrapper with-down-arrow">{child}</div> : child}
      </label>
    );
  }
);

export const LabeledInput = React.forwardRef(({ type, ...props }: any, ref) => {
  return <LabeledFormControl component="input" ref={ref} type={type || 'text'} name={type} {...props} />;
});

export const LabeledOutput = React.forwardRef(({ type, ...props }: any, ref) => (
  <LabeledFormControl component="div" ref={ref} type={type || 'text'} name={type} {...props} />
));

export const LabeledSelect = (props: any) => <LabeledFormControl component="select" {...props} />;

export const LabeledTextArea = (props: any) => <LabeledFormControl component="textarea" {...props} />;

export const LinkButton = ({
  className = '',
  blank = false,
  outline = false,
  rounded = false,
  absolute = false,
  ...props
}: any) => {
  const Component = props.to ? (absolute ? Link : LocaleLink) : 'a';
  return (
    <Component
      className={classNames('button', { outline, rounded }, className)}
      {...(blank ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    />
  );
};

export const Spinner = ({ delayMs }: { delayMs?: number }) => {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setShowSpinner(true), delayMs);
    return () => clearTimeout(timeoutId);
  }, []);

  return showSpinner ? (
    <div className="spinner">
      <span />
    </div>
  ) : null;
};
Spinner.defaultProps = { delayMs: 300 };

export const StyledLink = ({
  blank = false,
  className,
  ...props
}: (React.HTMLProps<HTMLAnchorElement> | React.ComponentProps<typeof LocaleLink>) & { blank?: boolean }) => {
  const Component = props.href ? 'a' : LocaleLink;
  return (
    <Component
      className={'link ' + (className || '')}
      {...(blank ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    />
  );
};

export const TextButton = ({ className = '', ...props }: any) => (
  <button type="button" className={'text-button ' + className} {...props} />
);

export const Toggle = ({
  offText,
  onText,
  ...props
}: { offText: string; onText: string } & HTMLProps<HTMLInputElement>) => (
  <div className="toggle-input">
    <input type="checkbox" {...props} />
    <Localized id={offText}>
      <div />
    </Localized>
    <Localized id={onText}>
      <div />
    </Localized>
  </div>
);

export const DownloadButton = ({
  link = '',
  className = '',
  children,
  ...props
}: { link: string; className: string; children?: React.ReactNode } & React.ComponentProps<typeof LinkButton>) => (
  <LinkButton className={`download-button ${className}`} href={link} download {...props}>
    <CloudIcon />
    {children}
  </LinkButton>
);
