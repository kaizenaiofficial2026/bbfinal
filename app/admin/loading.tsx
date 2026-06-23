/** Shown during admin route transitions — a top progress bar + content skeleton. */
export default function AdminLoading() {
  return (
    <>
      <span className="admin-progress" aria-hidden="true" />
      <div className="admin-stack" aria-busy="true" aria-label="Loading">
        <div>
          <span className="admin-skeleton admin-skeleton--kicker" />
          <span className="admin-skeleton admin-skeleton--title" />
        </div>
        <div className="admin-card admin-stack">
          <span className="admin-skeleton admin-skeleton--row" />
          <span className="admin-skeleton admin-skeleton--row" />
          <span className="admin-skeleton admin-skeleton--row" />
        </div>
      </div>
    </>
  );
}
