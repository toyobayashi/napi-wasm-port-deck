#!/usr/bin/env node

import { createRequire } from 'node:module'
import { main as demoMain } from './demo-main.mjs'

const require = createRequire(import.meta.url)
demoMain(require('../build/Release/demo.node'))
