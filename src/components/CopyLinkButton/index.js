import React, { useState } from 'react';
import { Button } from '../UI';

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);

  const copyLinkToClipboard = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);

      // Сбрасываем состояние "скопировано" после 2 секунд
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div>
      <Button style={{width:'100%'}} onClick={copyLinkToClipboard}>
        {copied ? 'Ссылка скопирована!' : 'Копировать ссылку-приглашение'}
      </Button>
    </div>
  );
};

export default CopyLinkButton;