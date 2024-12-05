import * as LucideIcons from 'lucide-react';

/**
 * Renders an icon from the LucideIcons library by name.
 *
 * @param iconName - The name of the icon to render.
 * @param klass - Additional CSS class names for styling the icon.
 * @param size - The size of the icon (default: 20).
 * @returns The rendered icon component or null if not found.
 */
export const renderIcon = (iconName: string, klass: string = '', size: number = 20) => {
  const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.FC<{ size?: number; className?: string }>;
  if (!Icon) {
    console.warn(`Icon "${iconName}" not found in LucideIcons.`);
    return null;
  }
  return <Icon size={size} className={klass} />;
};
