import Link from 'next/link'
import styles from './page.module.css'
import HomeMotion from './_components/home-motion'
import PilotModal from './_components/pilot-modal'
import PilotButton from './_components/pilot-button'

export default function Home() {
  return (
    <div className={styles.page}>
      <HomeMotion navScrolledClass={styles.navScrolled} revealInClass={styles.revealIn} />
      <PilotModal />
      <div className={styles.scrollProgress} id="tsv-progress" />

      <nav className={styles.nav} id="tsv-nav">
        <div className={`${styles.shell} ${styles.navInner}`}>
          <Link href="/" className={styles.wordmark}>
            The Student&apos;s <span className={styles.wordmarkAccent}>Verdict</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#problem">The Problem</a>
            <a href="#approach">Our Approach</a>
            <a href="#tensions">The Six Tensions</a>
            <a href="#how">How It Works</a>
          </div>
          <div className={styles.navActions}>
          <Link href="/login" className={`${styles.btn} ${styles.btnGhost} ${styles.navLoginBtn}`}>Log in</Link>
          <PilotButton className={`${styles.btn} ${styles.btnPrimary}`}>
              Request a Pilot <span className={styles.arr}>&rarr;</span>
            </PilotButton>
          </div>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroBgWord}>Verdict</div>
        <div className={styles.heroRule} />
        <div className={`${styles.shell} ${styles.heroGrid}`}>
          <div>
            <span className={styles.eyebrow} data-reveal>A civics curriculum for AP Government classrooms</span>
            <h1 className={`${styles.heroTitle} ${styles.reveal} ${styles.revealBlur} ${styles.d1}`} data-reveal>
              Teach students to render their own <em className={styles.underlineDraw}>political verdicts.</em>
            </h1>
            <p className={`${styles.heroSub} ${styles.reveal} ${styles.d2}`} data-reveal>
              The Student&apos;s Verdict prepares high schoolers to think clearly about political
              questions, weigh competing values, deliberate across disagreement, and render their own informed political judgements.
            </p>
            <div className={`${styles.heroCtas} ${styles.reveal} ${styles.d3}`} data-reveal>
              <PilotButton className={`${styles.btn} ${styles.btnPrimary}`}>
                Request a Pilot <span className={styles.arr}>&rarr;</span>
              </PilotButton>
              <a href="#how" className={`${styles.btn} ${styles.btnGhost}`}>Explore the Curriculum</a>
            </div>
            <p className={`${styles.heroCtaNote} ${styles.reveal} ${styles.d4}`} data-reveal>
              <span className={styles.pulseDot} />
              Currently finding district partners to pilot with for the 2026&ndash;27 school year.
            </p>
          </div>
          <div className={`${styles.verdictCard} ${styles.reveal} ${styles.d3}`} data-reveal>
            <div className={styles.vcEyebrow}>
              <span>A Student&apos;s Verdict</span>
              <span className={styles.vcTag}>UNIT 4</span>
            </div>
            <div className={styles.vcQuestion}>
              Should immigration enforcement be decided at the federal or state level?
            </div>
            <div className={styles.vcTension}>
              <div className={styles.vcPole}>Federal Level</div>
              <div className={styles.vcVs}>vs.</div>
              <div className={styles.vcPole}>State Level</div>
            </div>
            <div className={styles.vcSlider}>
              <div className={styles.vcSliderFill} id="tsv-vcfill" />
              <div className={styles.vcKnob} id="tsv-vcknob" />
            </div>
            <div className={styles.vcLabel}>The student&apos;s defended position</div>
            <div className={styles.vcVerdict}>
              &ldquo;I lean toward the state level. There are things nuances in enforcement that only people in the state can decide.&rdquo;
            </div>
          </div>
        </div>
      </header>

      <div className={styles.statstrip}>
        <div className={`${styles.shell} ${styles.statRow}`}>
          <div className={`${styles.statItem} ${styles.reveal}`} data-reveal>
            <div className={styles.statNum}>5</div>
            <div className={styles.statLabel}>Units</div>
          </div>
          <div className={`${styles.statItem} ${styles.reveal} ${styles.d1}`} data-reveal>
            <div className={styles.statNum}>6</div>
            <div className={styles.statLabel}>Lesson Types</div>
          </div>
          <div className={`${styles.statItem} ${styles.reveal} ${styles.d2}`} data-reveal>
            <div className={styles.statNum}>6</div>
            <div className={styles.statLabel}>Core Tensions</div>
          </div>
          <div className={`${styles.statItem} ${styles.reveal} ${styles.d3}`} data-reveal>
            <div className={styles.statNum}>~30</div>
            <div className={styles.statLabel}>Lessons a Year</div>
          </div>
        </div>
      </div>

      <section className={styles.problem} id="problem">
        <div className={`${styles.ghost} ${styles.ghostLight}`} style={{ fontSize: '21rem', bottom: '-5rem', left: '-3rem' }}>Gaps</div>
        <div className={styles.shell}>
        <div className={`${styles.sectionHead} ${styles.reveal} ${styles.revealBlur}`} data-reveal>
            <span className={styles.secNumeral}>01 &mdash; The Problem</span>
            <span className={styles.eyebrow}>The Civic Education Gap</span>
            <h2>Students learn what government is. They rarely learn how to take part in it.</h2>
            <p>
              Government courses do their job well. They teach the necessary groundwork: branches, federalism, ideology, the
              mechanics of voting. But three gaps sit between that knowledge and real civic
              capability.
            </p>
          </div>
          <div className={styles.gapGrid}>
            <div className={`${styles.gapCard} ${styles.reveal} ${styles.d1}`} data-reveal>
              <div className={styles.gapNum}>Gap 01</div>
              <h3>The Knowledge&ndash;Skill Gap</h3>
              <p>
                Courses teach what government is, not how to participate in it &mdash; how to read a
                headline, weigh a tradeoff, evaluate a source, research a local candidate, or
                examine one&apos;s own beliefs.
              </p>
            </div>
            <div className={`${styles.gapCard} ${styles.reveal} ${styles.d2}`} data-reveal>
              <div className={styles.gapNum}>Gap 02</div>
              <h3>The Discourse Gap</h3>
              <p>
                Students absorb political content constantly, but rarely have a structured place
                to disagree well. School may be the only setting where they can learn to
                deliberate across difference.
              </p>
            </div>
            <div className={`${styles.gapCard} ${styles.reveal} ${styles.d3}`} data-reveal>
              <div className={styles.gapNum}>Gap 03</div>
              <h3>The Integration Gap</h3>
              <p>
                Civic resources are scattered, single-purpose, and uncurated. Busy but capable teachers must
                assemble a curriculum themselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="approach">
        <div className={`${styles.ghost} ${styles.ghostLight}`} style={{ fontSize: '19rem', top: '2rem', right: '-4rem' }}>Method</div>
        <div className={styles.shell}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
            <span className={styles.secNumeral}>02 &mdash; Our Approach</span>
            <span className={styles.eyebrow}>Our Pedagogical Approach</span>
            <h2>Civic capability is a skill. Skills are built deliberately.</h2>
            <p>
              TSV is designed around a set of teaching commitments &mdash; convictions about how
              civic reasoning is actually learned.
            </p>
          </div>
          <div className={styles.approachGrid}>
            {[
              ['01', 'Civic education is skill-based', "Evaluating information, recognizing one's biases, weighing values, holding a civil conversation are muscles. They must be taught explicitly, not assumed."],
              ['02', 'Controversy is pedagogy', 'Students will encounter political controversy regardless. The classroom is the one controlled environment where they can learn to navigate it well.'],
              ['03', 'Brave spaces, not safe spaces', 'Drawing on the NAPSA model, TSV builds environments for productive discomfort. Having challenging dialogue is a real civic skill.'],
              ['04', 'Structure enables freedom', 'Unstructured discussion rewards the most confident voice. Rigorous structure gives every student the room to think a question through.'],
              ['05', 'Civic education must produce participants', 'A student who can analyze politics but never acts is only half-educated. The curriculum builds toward tangible civic action.'],
              ['06', 'Teachers are professionals', 'TSV provides frameworks, language, and tactical guidance. The teacher remains the final arbiter of how they are deployed in the classroom.'],
            ].map(([num, title, body], i) => (
              <div
                key={num}
                className={`${styles.posCard} ${styles.reveal} ${i % 2 === 0 ? styles.d1 : styles.d2}`}
                data-reveal
              >
                <div className={styles.posMarker}>{num}</div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.tensions} id="tensions">
        <div className={`${styles.ghost} ${styles.ghostAccent}`} style={{ fontSize: '24rem', top: '1rem', left: '-5rem' }}>Six</div>
        <div className={styles.shell}>
        <div className={`${styles.sectionHead} ${styles.sectionCenter} ${styles.reveal} ${styles.revealBlur}`} data-reveal>
            <span className={styles.secNumeral} style={{ color: 'var(--gold)' }}>03 &mdash; The Framework</span>
            <span className={`${styles.eyebrow} ${styles.eyebrowCenter}`}>The Analytical Framework</span>
            <h2>The Six Tensions of American Politics</h2>
            <p style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              Six classic tensions sit beneath nearly every political question. Students who can
              name and weigh them are equipped to reason through almost anything they meet.
            </p>
          </div>
          <div className={styles.tensionGrid}>
            {[
              ['01', 'Liberty', 'Order', 'How much freedom do we trade for safety, security, and stability?'],
              ['02', 'Liberty', 'Equality', 'Should the system maximize freedom or fairness? And does fairness mean equal rules or equal results?'],
              ['03', 'Majority Rule', 'Minority Rights', "When do numbers decide?"],
              ['04', 'Individual', 'Community', 'Is the basic unit of politics the person or the group? More than that, what do citizens owe one another?'],
              ['05', 'Centralized', 'Decentralized Power', 'Who decides? At what level of government?'],
              ['06', 'Tradition', 'Progress', 'When do we keep what works, and when do we change it?'],
            ].map(([num, left, right, body], i) => (
              <div
                key={num}
                className={`${styles.tensionCard} ${styles.reveal} ${[styles.d1, styles.d2, styles.d3][i % 3]}`}
                data-reveal
              >
                <div className={styles.tensionNum}>Tension {num}</div>
                <div className={styles.tensionPoles}>{left} <em>vs.</em> {right}</div>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how">
        <div className={`${styles.ghost} ${styles.ghostLight}`} style={{ fontSize: '20rem', bottom: '-4rem', right: '-3rem' }}>Year</div>
        <div className={styles.shell}>
          <div className={`${styles.sectionHead} ${styles.reveal}`} data-reveal>
            <span className={styles.secNumeral}>04 &mdash; The Curriculum</span>
            <span className={styles.eyebrow}>The Curriculum Architecture</span>
            <h2>A plug and play for teachers, year-long arc, built in five units.</h2>
            <p>
              Each unit is an arc that builds toward a deliberation. The goal is for students to put the
              unit&apos;s skills to work on a contested question. Teacher&apos;s do not need to worry about prep. 
            </p>
          </div>

          <div className={styles.unitsRow}>
            {[
              ['1', 'Thinking & Reasoning Foundations'],
              ['2', 'Government Foundations'],
              ['3', 'Information Literacy'],
              ['4', 'Personal Politics'],
              ['5', 'Doing Democracy'],
            ].map(([num, name], i) => (
              <div
                key={num}
                className={`${styles.unitPill} ${styles.reveal} ${[styles.d1, styles.d2, styles.d3, styles.d4, styles.d5][i]}`}
                data-reveal
              >
                <div className={styles.unitNum}>{num}</div>
                <h4>{name}</h4>
              </div>
            ))}
          </div>
          <div className={`${styles.unitConnector} ${styles.reveal}`} data-reveal />

          <div className={styles.ladder}>
            <div className={`${styles.reveal} ${styles.d1}`} data-reveal>
              <span className={styles.eyebrow} style={{ marginBottom: '1.1rem' }}>Six Lesson Types</span>
              <div className={styles.lessonTypes}>
                {[
                  ['I', 'Briefing', 'Anchors the unit — opening, teaching, apply, reflect.'],
                  ['II', 'Artifact Analysis', 'Close reading of a real political source.'],
                  ['III', 'Deliberation', "The unit's culminating contested question."],
                  ['IV', 'Civic Action', 'Tangible participation — beyond analysis.'],
                  ['V', 'Reflection', "Guided examination of one's own thinking."],
                  ['VI', 'Reflection Share', 'Bringing private reflection into the room.'],
                ].map(([tag, title, body]) => (
                  <div key={tag} className={styles.lessonType}>
                    <span className={styles.ltTag}>{tag}</span>
                    <div>
                      <h4>{title}</h4>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${styles.journalBox} ${styles.reveal} ${styles.d2}`} data-reveal>
              <span className={styles.eyebrow}>The Civic Journal</span>
              <h3>Every student keeps a running record of their own developing judgment.</h3>
              <p>
                Across the year, students build a personal civic journal &mdash; a real record of
                what they thought, and why, as their reasoning develops from September to May.
              </p>
              <p>
                The journal is the spine of the curriculum. &ldquo;The Student&apos;s Verdict&rdquo;
                is not a single test &mdash; it is the student&apos;s own cumulative body of
                reasoned positions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.standards} id="standards">
        <div className={`${styles.shell} ${styles.standardsInner}`}>
          <div className={styles.reveal} data-reveal>
            <span className={styles.secNumeral}>05 &mdash; Standards</span>
            <span className={styles.eyebrow}>Standards Alignment</span>
            <h2 className={styles.standardsHeading}>Built to run alongside Government Classes.</h2>
            <p className={styles.standardsText}>
              TSV is designed to complement the College Board&apos;s AP U.S. Government and Politics
              course. Each unit connects to content students already
              encounter in the required curriculum, and adds an element of political discourse.
            </p>
          </div>
          <div className={styles.standardsList}>
            {[
              ['Complements required coursework', 'Unit content maps to the foundations, institutions, and processes of AP Gov.'],
              ['A toolkit for teachers, not a replacement', 'Frameworks, language, and tactical guidance — the teacher decides how to deploy them.'],
              ['Designed for the school year', 'Five units across the year, pacing that fits alongside an existing course.'],
            ].map(([title, body], i) => (
              <div
                key={title}
                className={`${styles.stdItem} ${styles.reveal} ${[styles.d1, styles.d2, styles.d3][i]}`}
                data-reveal
              >
                <div className={styles.stdCheck}>&#10003;</div>
                <div>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta} id="pilot">
        <div className={`${styles.ghost} ${styles.ghostAccent}`} style={{ fontSize: '22rem', bottom: '-6rem', right: '-4rem' }}>Verdict</div>
        <div className={styles.shell}>
          <span className={`${styles.eyebrow} ${styles.reveal}`} data-reveal>Pilot Partnerships</span>
          <h2 className={`${styles.reveal} ${styles.revealBlur} ${styles.d1}`} data-reveal>
            Bring real civic reasoning <em className={styles.underlineDraw}>to your district.</em>
          </h2>
          <p className={`${styles.reveal} ${styles.d2}`} data-reveal>
            We&apos;re partnering with districts for the 2026&ndash;27 school year. Request a pilot
            and we&apos;ll walk you through the curriculum, the platform, and what a partnership
            looks like.
          </p>
          <div className={`${styles.heroCtas} ${styles.reveal} ${styles.d3}`} data-reveal>
          <PilotButton className={`${styles.btn} ${styles.btnPrimary}`}>
              Request a Pilot <span className={styles.arr}>&rarr;</span>
            </PilotButton>
            <a href="#how" className={`${styles.btn} ${styles.btnGhost}`} style={{ color: '#fff', borderColor: '#3a3a30' }}>
              Explore the Curriculum
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <span className={styles.wordmark}>
              The Student&apos;s <span className={styles.wordmarkAccent}>Verdict</span>
            </span>
            <p>A civics curriculum that prepares high school students to render their own informed political judgments.</p>
          </div>
          <div className={styles.footerCols}>
            <div className={styles.footerCol}>
              <h5>Curriculum</h5>
              <a href="#how">The Five Units</a>
              <a href="#tensions">The Six Tensions</a>
              <a href="#approach">Our Approach</a>
            </div>
            <div className={styles.footerCol}>
              <h5>For Districts</h5>
              <a href="#pilot">Request a Pilot</a>
              <a href="#standards">Standards Alignment</a>
              <Link href="/login">Log in</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBase}>
          <span>&copy; {new Date().getFullYear()} The Student&apos;s Verdict. </span>
          <span>Piloting for the 2026&ndash;27 school year.</span>
        </div>
      </footer>
    </div>
  )
}