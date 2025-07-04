import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders with correct variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByText('Delete')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-destructive')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByText('Click me')
    button.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
}) 