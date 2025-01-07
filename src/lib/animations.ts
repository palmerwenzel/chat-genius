import { type VariantProps, cva } from "class-variance-authority"

// Base animation variants shared across all animations
const baseVariants = {
  duration: {
    default: "duration-200",
    fast: "duration-100",
    slow: "duration-300",
    slower: "duration-500",
    verySlow: "duration-1000",
  },
  delay: {
    none: "",
    short: "delay-100",
    medium: "delay-200",
    long: "delay-300",
    longer: "delay-500",
  },
  ease: {
    default: "ease-out",
    in: "ease-in",
    inOut: "ease-in-out",
    linear: "linear",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Bouncy effect
  },
}

export const fadeIn = cva("animate-in fade-in", {
  variants: {
    ...baseVariants,
    opacity: {
      default: "opacity-100",
      semi: "opacity-90",
      light: "opacity-75",
      lighter: "opacity-50",
    },
  },
  defaultVariants: {
    duration: "default",
    delay: "none",
    ease: "default",
    opacity: "default",
  },
})

export const fadeOut = cva("animate-out fade-out", {
  variants: {
    ...baseVariants,
    opacity: {
      default: "opacity-0",
      semi: "opacity-10",
      light: "opacity-25",
      lighter: "opacity-50",
    },
  },
  defaultVariants: {
    duration: "default",
    delay: "none",
    ease: "default",
    opacity: "default",
  },
})

export const slideIn = cva("animate-in", {
  variants: {
    ...baseVariants,
    direction: {
      top: "slide-in-from-top",
      bottom: "slide-in-from-bottom",
      left: "slide-in-from-left",
      right: "slide-in-from-right",
    },
    distance: {
      default: "",
      short: "translate-y-2",
      medium: "translate-y-4",
      long: "translate-y-6",
      full: "translate-y-full",
    },
  },
  defaultVariants: {
    direction: "bottom",
    duration: "default",
    delay: "none",
    ease: "default",
    distance: "default",
  },
})

export const slideOut = cva("animate-out", {
  variants: {
    ...baseVariants,
    direction: {
      top: "slide-out-to-top",
      bottom: "slide-out-to-bottom",
      left: "slide-out-to-left",
      right: "slide-out-to-right",
    },
    distance: {
      default: "",
      short: "translate-y-2",
      medium: "translate-y-4",
      long: "translate-y-6",
      full: "translate-y-full",
    },
  },
  defaultVariants: {
    direction: "bottom",
    duration: "default",
    delay: "none",
    ease: "default",
    distance: "default",
  },
})

export const zoomIn = cva("animate-in zoom-in", {
  variants: {
    ...baseVariants,
    scale: {
      default: "scale-100",
      small: "scale-95",
      large: "scale-105",
      larger: "scale-110",
    },
  },
  defaultVariants: {
    duration: "default",
    delay: "none",
    ease: "default",
    scale: "default",
  },
})

export const zoomOut = cva("animate-out zoom-out", {
  variants: {
    ...baseVariants,
    scale: {
      default: "scale-95",
      small: "scale-90",
      large: "scale-75",
      larger: "scale-50",
    },
  },
  defaultVariants: {
    duration: "default",
    delay: "none",
    ease: "default",
    scale: "default",
  },
})

export const spinIn = cva("animate-in", {
  variants: {
    ...baseVariants,
    direction: {
      clockwise: "spin-in",
      counterclockwise: "-spin-in",
    },
    degrees: {
      default: "rotate-0",
      quarter: "rotate-90",
      half: "rotate-180",
      full: "rotate-360",
    },
  },
  defaultVariants: {
    direction: "clockwise",
    duration: "default",
    delay: "none",
    ease: "default",
    degrees: "default",
  },
})

export const shake = cva("animate-shake", {
  variants: {
    ...baseVariants,
    intensity: {
      default: "translate-x-0.5",
      gentle: "translate-x-0.25",
      strong: "translate-x-1",
    },
  },
  defaultVariants: {
    duration: "fast",
    delay: "none",
    ease: "linear",
    intensity: "default",
  },
})

export const pulse = cva("animate-pulse", {
  variants: {
    duration: {
      default: "duration-1000",
      fast: "duration-700",
      slow: "duration-2000",
    },
    intensity: {
      default: "opacity-50",
      gentle: "opacity-75",
      strong: "opacity-25",
    },
  },
  defaultVariants: {
    duration: "default",
    intensity: "default",
  },
})

export const bounce = cva("animate-bounce", {
  variants: {
    duration: {
      default: "duration-1000",
      fast: "duration-500",
      slow: "duration-2000",
    },
    height: {
      default: "translate-y-1",
      small: "translate-y-0.5",
      large: "translate-y-2",
    },
  },
  defaultVariants: {
    duration: "default",
    height: "default",
  },
})

// Types for all animations
export type FadeInProps = VariantProps<typeof fadeIn>
export type FadeOutProps = VariantProps<typeof fadeOut>
export type SlideInProps = VariantProps<typeof slideIn>
export type SlideOutProps = VariantProps<typeof slideOut>
export type ZoomInProps = VariantProps<typeof zoomIn>
export type ZoomOutProps = VariantProps<typeof zoomOut>
export type SpinInProps = VariantProps<typeof spinIn>
export type ShakeProps = VariantProps<typeof shake>
export type PulseProps = VariantProps<typeof pulse>
export type BounceProps = VariantProps<typeof bounce>

// Utility function to combine multiple animations
export const combineAnimations = (...animations: string[]) => {
  return animations.join(" ")
}

// Utility to create staggered animations for lists
export const createStaggeredAnimation = (
  animation: string,
  itemCount: number,
  baseDelay: number = 100
) => {
  return Array.from({ length: itemCount }, (_, i) => ({
    className: animation,
    style: { animationDelay: `${baseDelay * (i + 1)}ms` },
  }))
}

// Example usage:
// Single animation:
// const className = fadeIn({ duration: "slow", ease: "bounce" })
//
// Combined animations:
// const className = combineAnimations(
//   fadeIn({ duration: "slow" }),
//   slideIn({ direction: "bottom", delay: "short" })
// )
//
// Staggered list animation:
// const items = ["Item 1", "Item 2", "Item 3"]
// const animations = createStaggeredAnimation(
//   fadeIn({ duration: "slow" }),
//   items.length
// )
// items.map((item, index) => (
//   <div
//     key={item}
//     className={animations[index].className}
//     style={animations[index].style}
//   >
//     {item}
//   </div>
// )) 