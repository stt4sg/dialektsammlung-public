import * as React from 'react';
import { useState } from 'react';
import Modal from '../../modal/modal';
import { DownloadButton } from '../../ui/ui';

import './media-modal.css';

interface Props {
  media: string;
  title?: string;
  onClose: () => void;
}

export default ({ media, title, onClose }: Props) => (
  <Modal innerClassName="media-modal" onRequestClose={onClose}>
    {title && <h3>{title}</h3>}
    <div className="media-contain">
      <img src={media} />
    </div>
    <DownloadButton link={media} rounded />
  </Modal>
);
