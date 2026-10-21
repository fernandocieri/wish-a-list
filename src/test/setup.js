import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { faker } from '@faker-js/faker'

// Fixed seed before every test: generated data is random-looking but identical on every run.
beforeEach(() => {
  faker.seed(42)
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
