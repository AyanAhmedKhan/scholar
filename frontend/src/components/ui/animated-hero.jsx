import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Hero() {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["Transparent", "Efficient", "Paperless", "Fast", "Secure"],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="w-full relative z-10">
            <div className="container mx-auto">
                <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">

                    <div className="flex gap-6 flex-col items-center">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl max-w-4xl tracking-tight text-center font-display font-bold leading-[1.1]">
                            <span className="text-slate-900 block mb-2">MITS Scholar is</span>
                            <span className="relative flex w-full justify-center overflow-hidden text-center h-[1.2em] pb-4">
                                &nbsp;
                                {titles.map((title, index) => (
                                    <motion.span
                                        key={index}
                                        className="absolute font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
                                        initial={{ opacity: 0, y: -100 }}
                                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                        animate={
                                            titleNumber === index
                                                ? {
                                                    y: 0,
                                                    opacity: 1,
                                                }
                                                : {
                                                    y: titleNumber > index ? -150 : 150,
                                                    opacity: 0,
                                                }
                                        }
                                    >
                                        {title}
                                    </motion.span>
                                ))}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl leading-relaxed tracking-tight text-slate-600 max-w-2xl text-center font-medium">
                            The unified digital platform for MITS Gwalior scholarships.
                            <span className="hidden md:inline"><br /></span>
                            Say goodbye to paperwork. Apply, track, and receive funds directly.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-fade-in-up delay-200">
                        <Link to="/login">
                            <Button size="lg" variant="glow" className="gap-3 w-full sm:w-auto">
                                Get Started <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                        <a href="#scholarships">
                            <Button size="lg" variant="outline" className="gap-3 w-full sm:w-auto">
                                View Scholarships
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { Hero };
