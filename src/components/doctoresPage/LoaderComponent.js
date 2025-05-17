import React from "react";
import { motion } from "framer-motion";

export default function LoaderComponent() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-xl font-medium text-slate-700 text-center"
      >
        Estamos buscando tu doctor ideal
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-2 text-slate-500"
      >
        Por favor, espera un momento...
      </motion.div>
    </div>
  );
}
