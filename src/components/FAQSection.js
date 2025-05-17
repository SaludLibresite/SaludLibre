import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

const questionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  })
};

const answerVariants = {
  hidden: { 
    opacity: 0,
    height: 0,
    marginTop: 0
  },
  visible: { 
    opacity: 1,
    height: "auto",
    marginTop: "0.5rem",
    transition: {
      duration: 0.4,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  },
  exit: { 
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

const iconVariants = {
  open: { 
    rotate: 180,
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  },
  closed: { 
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

export default function FAQSection({ faqs }) {
  return (
    <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl py-12">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl">
          <motion.dl 
            className="mt-8 divide-y divide-gray-900/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                custom={index}
                variants={questionVariants}
                className="py-6 first:pt-0 last:pb-0"
              >
                <Disclosure>
                  {({ open }) => (
                    <>
                      <dt>
                        <DisclosureButton className="group flex w-full items-start justify-between text-left">
                          <motion.div
                            className="flex items-center gap-3"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <span className="text-2xl">{faq.icon}</span>
                            <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {faq.question}
                            </span>
                          </motion.div>
                          <motion.span 
                            className="ml-6 flex h-7 items-center"
                            variants={iconVariants}
                            animate={open ? "open" : "closed"}
                          >
                            <PlusSmallIcon 
                              aria-hidden="true" 
                              className="size-6 text-blue-600 group-data-[open]:hidden" 
                            />
                            <MinusSmallIcon 
                              aria-hidden="true" 
                              className="size-6 text-blue-600 group-[&:not([data-open])]:hidden" 
                            />
                          </motion.span>
                        </DisclosureButton>
                      </dt>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            variants={answerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <DisclosurePanel 
                              as="dd" 
                              className="mt-2 pr-12 pl-12"
                              static
                            >
                              <motion.p 
                                className="text-base text-gray-600 leading-relaxed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                {faq.answer}
                              </motion.p>
                            </DisclosurePanel>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </Disclosure>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </div>
    </div>
  )
}
