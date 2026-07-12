import { motion } from 'framer-motion'

const wordVariants = {
  hidden: { y: '110%', opacity: 0, rotate: 4 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.045,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

/**
 * Word-by-word clip reveal — feels premium vs plain fade-in.
 */
export default function TextReveal({ text, className = '', as: Tag = 'h1' }) {
  const words = text.split(' ')

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="flex flex-wrap gap-x-[0.28em]">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em]">
            <motion.span
              className="inline-block origin-bottom-left"
              custom={i}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  )
}
