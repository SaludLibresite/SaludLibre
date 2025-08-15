import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LoginButton } from "./LoginButton";

export default function NavBar() {
  const logo = "/logo.png";
  const links = [
    { href: "/", label: "Inicio" },
    { href: "/doctores", label: "Doctores" },
    { href: "/beneficios", label: "Beneficios" },
    { href: "/preguntas-frecuentes", label: "Preguntas Frecuentes" },
  ];
  const button = { text: "Iniciar Sesión", href: "/paciente/login" };

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
      },
    },
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const linkVariants = {
    hover: {
      scale: 1.05,
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  return (
    <motion.nav
      className={`w-full sticky top-0 transition-all duration-300  z-[90] bg-white border-b border-gray-200 ${
        scrolled ? "shadow-lg backdrop-blur-sm" : "bg-transparent"
      }`}
      initial="hidden"
      animate="visible"
      variants={navVariants}
    >
      <div className="lg:w-10/12 mx-auto flex items-center justify-between py-4 px-2 lg:px-4 md:px-6">
        <motion.div
          className="flex items-center gap-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {logo && (
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Logo"
                width={200}
                height={200}
                className="object-contain cursor-pointer transform hover:rotate-3 transition-transform duration-300"
              />
            </Link>
          )}
        </motion.div>

        {/* Desktop links */}
        <div className="hidden md:flex gap-6 flex-1 justify-center">
          {links &&
            links.map((link, i) => (
              <motion.a
                key={i}
                href={link.href}
                className="text-gray-900 font-medium text-base px-3 py-2 rounded-lg relative group"
                variants={linkVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                {link.label}
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-0.5  bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop LoginButton - only show on desktop */}
          <div className="hidden md:block">
            <LoginButton />
          </div>

          {/* Mobile menu button */}
          <motion.button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 relative z-50"
            onClick={() => setOpen(!open)}
            whileTap={{ scale: 0.9 }}
            aria-label="Abrir menú"
          >
            <motion.span
              className="block w-6 h-0.5 bg-slate-700 mb-1.5"
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-6 h-0.5 bg-slate-700 mb-1.5"
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-6 h-0.5 bg-slate-700"
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="md:hidden fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex items-center justify-between mb-8">
                  {logo && (
                    <Link href="/">
                      <Image
                        src={logo}
                        alt="Logo"
                        width={200}
                        height={200}
                        className="object-contain cursor-pointer"
                      />
                    </Link>
                  )}
                  <motion.button
                    onClick={() => setOpen(false)}
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Cerrar menú"
                  >
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  {links &&
                    links.map((link, i) => (
                      <motion.a
                        key={i}
                        href={link.href}
                        className="text-slate-700 hover:text-blue-600 font-medium text-lg px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                        onClick={() => setOpen(false)}
                        whileHover={{ x: 10 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {link.label}
                      </motion.a>
                    ))}
                </div>

                {/* Mobile LoginButton with proper styling */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <LoginButton isMobile={true} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
