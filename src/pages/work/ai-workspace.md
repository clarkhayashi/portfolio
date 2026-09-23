---
layout: ../../layouts/CaseStudy.astro
title: Personal AI Workspace
summary: "The system I run my job search and side projects through: a Claude Code workspace with custom skills, guardrail hooks, and scheduled tasks, plus planner-to-executor handoffs between models. Anything that leaves my computer waits for my approval."
tags: ["Claude Code", "Claude Cowork", "ChatGPT", "Gemini"]
statusLabel: "In daily use"
statusType: "progress"
---

## Overview

Since summer 2026 I've run my job search, side projects, and weekly admin through one AI workspace: a single folder with rules every model reads at the start of a session, reusable skills for work I repeat, and tasks that run on a schedule. I built it to get more done. It also turned into the most honest way I know to learn what these tools can and can't do.

## Problem

Working with a model one chat at a time doesn't scale. Every session starts from zero, the same instructions get retyped, good work gets buried in chat history, and nothing stops a model from confidently doing the wrong thing, like adding a claim to a resume that I never made or saving a file where I'll never find it.

## Context

Solo, personal project. I'm not a software engineer. I decide what gets automated, direct the models, check what they produce, and own the result. Claude Code and Claude Cowork are the main workspace; ChatGPT and Codex handle coding help and everyday questions; Gemini handles anything that lives in Google apps.

## My Role

Designer and operator: I set the rules, approve the specs, review the output, and fix the system when it breaks.

## Approach

- One source of truth. A single instructions file tells every session where things live, how files are named, and the hard rules: ask before deleting anything, ask before anything goes outward (email, posts, shared links), and never invent a fact about me.
- Custom skills for repeat work. Nine skills live in the workspace, including writing in my voice, networking emails, program applications, listing photo and reel workflows for real estate marketing, and a Japanese study tutor. A few are packaged so they can be reused outside the workspace.
- Guardrail hooks. Two scripts run automatically: one blocks files from being dropped loose at the top of the workspace, and one checks at the start of every session that the workspace hasn't been moved, duplicated, or replaced with a shortcut.
- Scheduled tasks. Recurring runs handle things like flight fare watches and weekly reports, writing results to files I review.
- Planner-to-executor handoffs. For bigger builds, a stronger model writes a spec that a fresh session with no prior context can follow, and cheaper models do the implementation. Handoff documents carry the decisions forward so nothing gets re-argued.
- Facts with a source. A master profile and a claim-boundaries file sit behind every resume and application draft. If a claim isn't backed there, the model has to ask me.
- The right tool for the job. I audited how I was actually using Claude, ChatGPT, and Gemini and wrote an operating guide that matches each type of task to a tool and model.

## What Broke

In early September, turning on iCloud's Desktop sync moved the workspace folder. A session found it at the new path, and I approved a shortcut so work could continue. Google Drive's backup couldn't follow the shortcut and started re-downloading the whole workspace as a duplicate, tens of thousands of files. Working through it with Claude, we traced the cause to two sync tools pointed at the same folder, restored the workspace without deleting anything, and added the start-of-session check above so a move or duplicate gets flagged immediately.

## Results

The workspace is in daily use. Six submitted applications and several drafts since July were built from the same master profile, with every claim traceable to something I actually did.

## Status

In daily use and still changing. Next: publish a short walkthrough of one skill from request to finished output.
