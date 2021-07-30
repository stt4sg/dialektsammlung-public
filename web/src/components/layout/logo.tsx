import * as React from 'react';
import { LocaleLink } from '../locale-helpers';
import { Localized } from '@fluent/react';
import './logo.css';

export default (props: { reverse?: boolean }) => {
  const imgSrc = props.reverse
    ? require('../../../img/logo_dialektsammlung_org_white.svg')
    : require('../../../img/logo_dialektsammlung_org.svg');

  return (
    <LocaleLink className="main-logo" to="">
      <img className="main-dialektsammlung-logo" width="150" src={imgSrc} />
    </LocaleLink>
  );
};

interface FlexGalleryProps {
  rowClass?: string;
  head?: React.ReactNode;
  children?: React.ReactNode;
}

/* We're loosing some compile-time error catching here,
 * but I currently don't see a better way without overcomplicating things.
 */
interface GalleryItemProps extends FlexGalleryProps {
  logos: any[];
  frameClass?: string;
  clickHandler?: (e: any) => void;
}

export const FlexGallery = ({ rowClass = '', head, children }: FlexGalleryProps) => (
  <div className="namedrop-canvas">
    {head}
    <div className={`logos-contain ${rowClass}`}>{children}</div>
  </div>
);

export const NameDrop = ({ logos = [], rowClass = '', frameClass = '', clickHandler, head }: GalleryItemProps) => (
  <FlexGallery head={head} rowClass={rowClass}>
    {logos.length > 0 &&
      logos.map((lname: string, i: number) => (
        /* We  try to emulate Wordpress convenience here, by allowing the default flex item style to be overwriten
         * as well as adding a unique class to each image for individual size customization.
         */
        <div key={`${lname}_${i}`} className={`logo-frame ${frameClass}`}>
          <img
            src={require(`../../../img/${lname}`)}
            id={lname.replace(/^[\w-]*\/*([\w-]+)\.[^/.]+$/, (m: string, g1: string) => g1)}
            onClick={clickHandler}
          />
        </div>
      ))}
  </FlexGallery>
);

export const FigDrop = ({ logos = [], rowClass = '', frameClass = '', clickHandler, head }: GalleryItemProps) => (
  <FlexGallery head={head} rowClass={rowClass}>
    {logos.length > 0 &&
      logos.map((lmeta: any, i: number) => (
        <figure key={`${lmeta.fname}_${i}`} className="logo-figure">
          <div className={`logo-frame ${frameClass}`}>
            <img
              src={require(`../../../img/${lmeta.fname}`)}
              id={lmeta.fname.replace(/^[\w-]*\/*([\w-]+)\.[^/.]+$/, (m: string, g1: string) => g1)}
              alt={lmeta.cap}
              onClick={clickHandler}
            />
          </div>
          <figcaption>{lmeta.cap}</figcaption>
        </figure>
      ))}
  </FlexGallery>
);
