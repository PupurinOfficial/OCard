import { Link, Outlet, useLocation } from 'react-router-dom';

export function SceneShell() {
  const { pathname } = useLocation();

  return (
    <div className="scene-shell">
      <div className="scene-atmosphere" aria-hidden="true" />
      {pathname !== '/' ? (
        <Link to="/" className="scene-back">
          ← 返回看板
        </Link>
      ) : null}
      <div className="scene-page" key={pathname}>
        <Outlet />
      </div>
    </div>
  );
}
