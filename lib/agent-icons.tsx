import React from 'react';
import {
  Broadcast, Eye, Brain, ClipboardText, Lightning, ShieldCheck,
  TrendUp, UserCircle, Compass,
} from 'phosphor-react-native';

type IconProps = { size?: number; color?: string; weight?: 'regular' | 'bold' | 'fill' | 'duotone' };

export function AgentIcon({ agent, ...rest }: { agent: string } & IconProps) {
  switch (agent) {
    case 'signal_fuse': return <Broadcast {...rest} />;
    case 'outbreak_eye': return <Eye {...rest} />;
    case 'severity_mind': return <Brain {...rest} />;
    case 'resource_forge': return <ClipboardText {...rest} />;
    case 'crisis_sim': return <Lightning {...rest} />;
    case 'recovery_guard': return <ShieldCheck {...rest} />;
    case 'trend_spy': return <TrendUp {...rest} />;
    case 'citizen_signal': return <UserCircle {...rest} />;
    case 'master':
    default: return <Compass {...rest} />;
  }
}
