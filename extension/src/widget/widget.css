import { useEffect, useState } from 'react'
import type { TriggerType, PersonaId } from '../shared/types'

// ─── ASCII art bank ───────────────────────────────────────────────────────────
// Keyed by trigger. Each entry has one or more frames for a simple "blink"
// animation — single-frame entries are static.

const ASCII_FRAMES: Record<TriggerType, string[]> = {
  late_night: [
    ' (\\_/)\n ( •_•)\n / >💤',
    ' (\\_/)\n ( -_-)\n / >💤'
  ],
  long_session: [
    ' (\\_/)\n ( ⊙_⊙)\n />☕',
    ' (\\_/)\n ( •_•)\n />☕'
  ],
  no_break: [
    '(╯°□°）\n  ╯︵ ☕',
    '(╯°□°）\n  ╯  ☕'
  ],
  github_commit: [
    ' (\\_/)\n ( •‿•)\n />🌿',
    ' (\\_/)\n ( ^‿^)\n />🌿'
  ],
  github_star: [
    '  ✦\n (\\_/)\n ( ★‿★)\n / >✨',
    '  ✧\n (\\_/)\n ( ☆‿☆)\n / >✨'
  ],
  leetcode_solved: [
    '  👍\n( •‿• )\n  ||',
    '  👍\n( ^‿^ )\n  ||'
  ],
  idle_return: [
    ' (\\_/)\n ( •_•)\n / >👋',
    ' (\\_/)\n ( •‿•)\n / >👋'
  ]
}

// ─── Persona response text bank ───────────────────────────────────────────────

type PersonaLines = Record<PersonaId, string[]>

const RESPONSES: Record<TriggerType, PersonaLines> = {
  late_night: {
    mom: [
      'Beta, so late ho gaya.\nSo ja. Kal fresh mind se karna.',
      'Khana khaya? Ab so ja please.'
    ],
    friend: [
      'Bro it\'s literally 2AM.\nLog so rahe hain. Tu bhi so.',
      'Dude. Sleep. The code will survive.'
    ],
    teacher: [
      'Fatigue degrades code quality.\nRest is part of the process.',
      'A tired mind makes expensive mistakes.\nClose the laptop.'
    ],
    drill_sergeant: [
      'SOLDIER. IT\'S 0200 HOURS.\nSHUT IT DOWN. NOW.',
      'YOU CANNOT DEBUG WHAT YOU CANNOT SEE.\nSLEEP. THAT\'S AN ORDER.'
    ]
  },
  long_session: {
    mom: [
      'Kitne ghante ho gaye?\nThoda paani pee. Ankhen rest karo.',
      'Uthke thoda chal. Neck aur back tight ho jaati hai.'
    ],
    friend: [
      'Bro how long have you been sitting?\nGet up for 5 minutes at least.',
      'Your posture rn must be criminal.\nStretch or something.'
    ],
    teacher: [
      'Extended sessions without breaks\nreduce focus and retention.',
      'The Pomodoro method exists for a reason.\nTake a break.'
    ],
    drill_sergeant: [
      'FIVE HOURS AT THE DESK.\nGET UP. MOVE. NOW.',
      'YOUR BRAIN IS A MUSCLE.\nIT NEEDS RECOVERY TIME. STAND UP.'
    ]
  },
  no_break: {
    mom: [
      'Bina break ke nahi chalega.\nThodi der ke liye uth ja.',
      'Beta uthke thoda paani pee\naur aankhein band karo.'
    ],
    friend: [
      'When did you last get up?\nSeriously. Stand up for 2 minutes.',
      'You\'ve been glued to the chair.\nYour back hates you rn.'
    ],
    teacher: [
      'Two hours without movement\nimpairs circulation and focus.',
      'Take a five-minute walk.\nYou\'ll come back sharper.'
    ],
    drill_sergeant: [
      'TWO HOURS. ZERO MOVEMENT.\nUNACCEPTABLE. ON YOUR FEET.',
      'STAND UP.\nWALK AROUND.\nCOME BACK STRONGER.'
    ]
  },
  github_commit: {
    mom: [
      'Kuch kiya tune aaj.\nProud feel ho raha hai. 🌿',
      'Ek aur kadam aage.\nAchha kaam kiya.'
    ],
    friend: [
      'Shipped something!\nFelt good, didn\'t it?',
      'Green square unlocked.\nKeep going.'
    ],
    teacher: [
      'Consistent commits signal\nconsistent progress. Well done.',
      'One commit closer to the goal.\nMomentum is the variable that matters.'
    ],
    drill_sergeant: [
      'COMMIT PUSHED.\nDON\'T CELEBRATE YET. NEXT TASK.',
      'GOOD. NOW WHAT\'S NEXT.\nKEEP MOVING FORWARD.'
    ]
  },
  github_star: {
    mom: [
      'Kisine tera kaam pasand kiya!\nMujhe tujhpe garv hai. ✨',
      'Star mila! Tune mehnat ki thi\naur log dekh rahe hain.'
    ],
    friend: [
      'Someone starred your repo!\nThat actually means something.',
      'Real person. Real star.\nYour work is being seen. 🌟'
    ],
    teacher: [
      'Recognition from the community.\nThis validates the quality of your work.',
      'A star is a bookmark from a stranger\nwho found your work valuable.'
    ],
    drill_sergeant: [
      'SOMEONE NOTICED YOUR WORK.\nDON\'T LET THEM DOWN. BUILD MORE.',
      'A STAR. USE IT AS FUEL.\nNOT COMFORT. FUEL.'
    ]
  },
  leetcode_solved: {
    mom: [
      'Solve kar liya! Wah wah!\nTu bahut smart hai beta. 👍',
      'Itna mushkil tha aur tune kar diya.\nMeri jaan!'
    ],
    friend: [
      'YOOO you got Accepted!!\nThat one was not easy.',
      'Bro you cracked it.\nOne more problem down. 🎉'
    ],
    teacher: [
      'Accepted. Pattern recognised.\nNow review the optimal solution too.',
      'Correct submission.\nDo you understand why it works?'
    ],
    drill_sergeant: [
      'ACCEPTED. GOOD.\nNEXT PROBLEM. NO RESTING.',
      'ONE DOWN.\nHOW MANY MORE CAN YOU HANDLE TODAY?'
    ]
  },
  idle_return: {
    mom: [
      'Wapas aa gaya?\nPaani piya? Kuch khaya?',
      'Break se wapas.\nFresh feel ho raha hai?'
    ],
    friend: [
      'Welcome back!\nHope you actually rested.',
      'Back at it?\nLet\'s go then. 👋'
    ],
    teacher: [
      'Good. You took a break.\nYou\'ll work better now.',
      'Rested mind, sharper focus.\nContinue where you left off.'
    ],
    drill_sergeant: [
      'BACK ALREADY?\nGOOD. DON\'T WASTE IT.',
      'BREAK IS OVER.\nFOCUS MODE: ACTIVATED.'
    ]
  }
}

// ─── component ────────────────────────────────────────────────────────────────

interface AsciiRendererProps {
  trigger: TriggerType
  persona: PersonaId
  onDismiss: () => void
}

export function AsciiRenderer({ trigger, persona, onDismiss }: AsciiRendererProps) {
  const [frame, setFrame] = useState(0)
  const [textIndex] = useState(() => {
    const pool = RESPONSES[trigger][persona]
    return Math.floor(Math.random() * pool.length)
  })

  const frames = ASCII_FRAMES[trigger]
  const text = RESPONSES[trigger][persona][textIndex]

  // Simple two-frame blink at 900ms interval
  useEffect(() => {
    if (frames.length < 2) return
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length)
    }, 900)
    return () => clearInterval(interval)
  }, [frames])

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="comp-ascii-renderer">
      <pre className="comp-ascii-art" aria-hidden="true">
        {frames[frame]}
      </pre>
      <p className="comp-reaction-text">{text}</p>
    </div>
  )
}
