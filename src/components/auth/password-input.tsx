'use client'

import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PasswordInputProps = React.ComponentProps<typeof Input>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false)

    return (
      <div className='relative'>
        <Input
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='absolute right-1 top-1/2 -translate-y-1/2'
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          title={isVisible ? 'Hide password' : 'Show password'}
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
