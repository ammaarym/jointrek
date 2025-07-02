import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface PollProps {
  className?: string;
}

export function Poll({ className }: PollProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);

  const handleVote = async (vote: 'yes' | 'no') => {
    setSelectedOption(vote);
    setHasVoted(true);

    // Store the vote (could be sent to backend later)
    try {
      await fetch('/api/poll-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: 'would-use-trek', answer: vote }),
      });
    } catch (error) {
      // Silently fail for now
      console.log('Poll vote submission failed, but vote was recorded locally');
    }
  };

  if (hasVoted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-[#FCFAF7] rounded-2xl p-6 shadow-md border border-stone-200 text-center ${className}`}
      >
        <div className="flex items-center justify-center mb-3">
          <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
          <span className="text-green-600 font-semibold">Thanks for voting!</span>
        </div>
        <p className="text-stone-600 text-sm">
          Your feedback helps us build something amazing for UF students.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-[#FCFAF7] rounded-2xl p-6 shadow-md border border-stone-200 ${className}`}
    >
      <p className="text-stone-700 mb-6 text-center text-lg font-medium">
        Would you use Trek?
      </p>
      
      <div className="flex gap-4 justify-center">
        <motion.button
          onClick={() => handleVote('yes')}
          className="flex-1 bg-[#F0E6D6] hover:bg-[#E8DCC6] text-[#8A6F47] font-semibold py-3 px-6 rounded-xl transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Yes
        </motion.button>
        <motion.button
          onClick={() => handleVote('no')}
          className="flex-1 bg-white hover:bg-gray-50 text-stone-700 font-semibold py-3 px-6 rounded-xl transition-colors border border-stone-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          No
        </motion.button>
      </div>
    </motion.div>
  );
}