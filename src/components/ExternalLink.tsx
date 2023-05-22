import { Link, LinkProps } from '@mui/material';

export default function ExternalLink({ children, ...props }: LinkProps) {
  return (
    <Link {...props} target="_blank" rel="noopener">
      {children}
    </Link>
  );
}
