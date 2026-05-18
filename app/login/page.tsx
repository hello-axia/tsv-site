import Link from 'next/link'
import styles from '../page.module.css'

export default function LoginPage() {
  return (
    <div className={`${styles.page} ${styles.loginWrap}`}>
      <div className={styles.loginGhost}>Verdict</div>

      <div className={styles.loginCard}>
        <Link href="/" className={styles.loginEyebrow}>
          The Student&apos;s Verdict
        </Link>
        <h1 className={styles.loginTitle}>Welcome back.</h1>
        <p className={styles.loginSub}>Sign in to continue.</p>

        <div className={styles.loginRoles}>
        <a href="/api/auth/login?role=teacher" className={`${styles.loginRole} ${styles.loginRoleTeacher}`}>
            <span className={styles.loginRoleLabel}>Sign in as</span>
            <span className={styles.loginRoleName}>Teacher</span>
          </a>
          <a href="/api/auth/login?role=student" className={`${styles.loginRole} ${styles.loginRoleStudent}`}>
            <span className={styles.loginRoleLabel}>Sign in as</span>
            <span className={styles.loginRoleName}>Student</span>
          </a>
        </div>
      </div>

      <Link href="/" className={styles.loginBack}>&larr; Back to home</Link>
    </div>
  )
}