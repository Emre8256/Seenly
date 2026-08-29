import React from 'react';
import {
  HeartHandshake,
  Sparkles,
  Brain,
  Telescope,
  Zap,
  ShieldCheck,
  Crown,
  Trophy,
  Gift,
  TreeDeciduous
} from 'lucide-react';

export const SIGNAL_CONFIG = {
  samimiyet: {
    Icon: HeartHandshake,
    labelTr: 'Samimiyet',
    labelEn: 'Sincerity',
    color: '#8F7BCC',
    bg: 'rgba(143, 123, 204, 0.12)',
    border: 'rgba(143, 123, 204, 0.28)'
  },
  cekicilik: {
    Icon: Sparkles,
    labelTr: 'Çekicilik',
    labelEn: 'Charm',
    color: '#E06553',
    bg: 'rgba(224, 101, 83, 0.12)',
    border: 'rgba(224, 101, 83, 0.28)'
  },
  zeka: {
    Icon: Brain,
    labelTr: 'Zeka',
    labelEn: 'Intellect',
    color: '#6A53D9',
    bg: 'rgba(106, 83, 217, 0.12)',
    border: 'rgba(106, 83, 217, 0.28)'
  },
  vizyon: {
    Icon: Telescope,
    labelTr: 'Vizyon',
    labelEn: 'Vision',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.28)'
  },
  enerji: {
    Icon: Zap,
    labelTr: 'Enerji',
    labelEn: 'Energy',
    color: '#D98A53',
    bg: 'rgba(217, 138, 83, 0.12)',
    border: 'rgba(217, 138, 83, 0.28)'
  },
  guvenilirlik: {
    Icon: ShieldCheck,
    labelTr: 'Güvenilirlik',
    labelEn: 'Trustworthiness',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.28)'
  },
  ego: {
    Icon: Crown,
    labelTr: 'Ego',
    labelEn: 'Ego',
    color: '#CC7BBA',
    bg: 'rgba(204, 123, 186, 0.12)',
    border: 'rgba(204, 123, 186, 0.28)'
  },
  basari: {
    Icon: Trophy,
    labelTr: 'Başarı',
    labelEn: 'Success',
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.28)'
  },
  comertlik: {
    Icon: Gift,
    labelTr: 'Cömertlik',
    labelEn: 'Generosity',
    color: '#E5A260',
    bg: 'rgba(229, 162, 96, 0.12)',
    border: 'rgba(229, 162, 96, 0.28)'
  },
  olgunluk: {
    Icon: TreeDeciduous,
    labelTr: 'Olgunluk',
    labelEn: 'Maturity',
    color: '#5B7A58',
    bg: 'rgba(91, 122, 88, 0.12)',
    border: 'rgba(91, 122, 88, 0.28)'
  }
};

/**
 * Modern vector icon badge for the 10 social traits
 */
export const SignalBadgeIcon = ({ 
  signalKey, 
  size = 18, 
  boxSize = 34, 
  strokeWidth = 2.1,
  className = "",
  style = {}
}) => {
  const conf = SIGNAL_CONFIG[signalKey] || {
    Icon: Sparkles,
    color: '#C5A059',
    bg: 'rgba(197, 160, 89, 0.12)',
    border: 'rgba(197, 160, 89, 0.28)'
  };

  const IconComponent = conf.Icon;

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 transition-transform ${className}`}
      style={{
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        backgroundColor: conf.bg,
        border: `1.5px solid ${conf.border}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        ...style
      }}
      title={conf.labelTr}
    >
      <IconComponent
        size={size}
        color={conf.color}
        strokeWidth={strokeWidth}
      />
    </div>
  );
};

export default SignalBadgeIcon;
