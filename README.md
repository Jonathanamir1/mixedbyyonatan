# Mixed by Yonatan

A client-facing web platform built for my music mixing and mastering business.

This project was built to replace manual workflows with a structured system for client onboarding, authentication, submissions, and booking management.

## Overview

Mixed by Yonatan is a real-world application built around an actual business use case.

Instead of managing everything manually through messages, email, and scattered file exchanges, this platform gives clients a single place to interact with the service.

The application combines a modern Next.js frontend with Firebase-backed authentication, data storage, file handling, and admin-side workflow management.

## Core Features

- Email/password and Google authentication
- Protected user dashboard
- Audio submission flow with file upload support
- Submission status tracking
- Admin-only area for workflow management
- Booking flow for accepted users
- Google Calendar OAuth integration
- Booking synchronization and cancellation routes
- Session handling between client auth and server-side protected routes

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript

### Backend / Services
- Firebase Authentication
- Firestore
- Firebase Storage
- Firebase Admin SDK
- Google Calendar API
- Google OAuth

### UI
- Tailwind CSS 4
- Framer Motion

## Architecture

The application is built around Firebase and Google service integrations:

- **Firebase Authentication** handles user login, signup, Google sign-in, and password reset
- **Firestore** stores submission and booking-related application data
- **Firebase Storage** supports audio file upload workflows
- **Firebase Admin SDK** is used in server-side routes for secure verification and admin operations
- **Google Calendar OAuth** connects booking workflows to calendar availability and event management

The project also includes:
- protected client-side routes
- server-side session cookie handling
- booking APIs for listing, syncing, and cancelling meetings
- meeting utility logic for generating available time slots

## What this project demonstrates

This project demonstrates my ability to:

- build a real client-facing web application
- design authenticated and role-aware user flows
- connect frontend interfaces to cloud-based backend services
- implement admin-only workflow tooling
- integrate third-party APIs into a business process
- structure a project around a real operational use case instead of a tutorial scenario

## Why I built it

I built this project for my own music business.

The goal was to create a more professional and organized workflow for how clients apply, submit tracks, and move through the service process.

This project also gave me hands-on experience building a production-style web application around real user and business needs.

## Running the Project

This repository is tightly integrated with the Firebase and Google services used by the original business workflow.

Because of that, it is **not provided as a plug-and-play local demo**. Running the full application requires private configuration, service credentials, and production-linked integrations that are not included in the repository.

This project is presented primarily as:
- a real business application
- a portfolio codebase
- a demonstration of full-stack application structure, service integration, and workflow design

## Project Status

This project is currently **benched**.

It is working for its intended scope, but further development is paused because the additional maintenance and feature expansion are not currently worth the extra operational effort.

The repository remains public as a portfolio project and as documentation of a real-world application built for a business use case.

## Notes

Private credentials, OAuth secrets, and production configuration are intentionally excluded from the repository.

## Author

Yonatan Amir  
Berlin, Germany
