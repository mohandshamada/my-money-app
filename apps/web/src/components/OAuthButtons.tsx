import React from 'react';
import { FaGoogle, FaMicrosoft, FaApple, FaFacebook } from 'react-icons/fa';

interface OAuthButtonsProps {
  onOAuthLogin: (provider: string) => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onOAuthLogin }) => {
  const providers = [
    { id: 'google', name: 'Google', icon: FaGoogle, color: '#DB4437' },
    { id: 'microsoft', name: 'Microsoft', icon: FaMicrosoft, color: '#00A4EF' },
    { id: 'apple', name: 'Apple', icon: FaApple, color: '#000000' },
    { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: '#1877F2' },
  ];

  return (
    <div className="oauth-buttons">
      <p className="divider">Or continue with</p>
      <div className="provider-grid">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="oauth-button"
            onClick={() => onOAuthLogin(provider.id)}
            style={{ '--provider-color': provider.color } as React.CSSProperties}
          >
            <provider.icon className="icon" />
            <span>{provider.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
