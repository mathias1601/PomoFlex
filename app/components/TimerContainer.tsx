'use client'
import React, { useRef, useState } from 'react'
import Timer from './Timer';
import '../styles/TimerStyles.css';
import useClickOutside from '../hooks/useClickOutside';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { closestCorners, DndContext } from '@dnd-kit/core';

import { TimerData } from '../types/TimerTypes';

interface Props {
	id: number,
	name: string;
	whenOpen: (id: number) => void;
	timers: TimerData[];
	setTimers: (timers: TimerData[]) => void;
	changeName: (newName: string, id: number) => void;
}

const TimerContainer = ({ id, name, whenOpen, timers = [], setTimers, changeName }: Props) => {

	const [currentTimerIndex, setCurrentTimerIndex] = useState<number>(-2);
	const [lastActiveTimer, setLastActiveTimer] = useState<number>(-2);

	//Props to add to the timer component
	const [minutesToAdd, setMinutesToAdd] = useState<number>(0);
	const [secondsToAdd, setSecondsToAdd] = useState<number>(0);
	const [timerName, setTimerName] = useState<string>("");
	const [repetitions, setRepetitions] = useState<number>(1);

	//Whether or not the container shows up
	const [visible, setVisible] = useState<boolean>(false);

	//Makes certain buttons visible or not, they should not be visible while the timer is playing
	const [isPlaying, setIsPlaying] = useState<boolean>(false);

	//Switches between the states of editing
	const [editing, setEditing] = useState<boolean>(true);

	//For changing the name of the container
	const [editingName, setEditingName] = useState<boolean>(false);

	//How many times the container should repeat
	const [originalRepetitions, setOriginalRepetitions] = useState<number>(1);
	const [containerRepetition, setContainerRepetition] = useState<number>(1);
	const [resetCounter, setResetCounter] = useState<number>(0);

	const addTimer = () => {
		let timeToAdd = 60 * minutesToAdd + secondsToAdd

		setTimers([
			...timers,
			{ id: Date.now(), duration: timeToAdd, name: timerName, hasFinished: false, repetitions: repetitions, originalDuration: timeToAdd, originalRepetitions: repetitions }
		]);
	};


	// Given to a Timer component so that we know whether a timer has finished or not
	const timerComplete = () => {
		setCurrentTimerIndex(lastActiveTimer + 1)
		setLastActiveTimer(lastActiveTimer + 1)

		//If the timer_container has reached the end and needs to repeat
		if (currentTimerIndex >= timers.length - 1 && containerRepetition > 1) {
			console.log("check")
			setTimers(timers.map(t => ({
				...t,
				id: Date.now() + Math.random(),
				duration: t.originalDuration,
				repetitions: t.originalRepetitions,
			})))
			console.log(timers[0].originalDuration)
			console.log("test")
			setContainerRepetition(containerRepetition - 1)
			setCurrentTimerIndex(0)
			setLastActiveTimer(0)
		}
		//If the timer has simply reached its end
		else if (currentTimerIndex >= timers.length - 1) {
			setCurrentTimerIndex(-2)
			setLastActiveTimer(-2)
		}
	}

	// Reset all timers
	const resetTimer = () => {
		setTimers(timers.map(t => ({
			...t,
			duration: t.originalDuration,
			repetitions: t.originalRepetitions,
			hasFinished: false,
		})));
		setCurrentTimerIndex(-2);
		setLastActiveTimer(-2);
		setIsPlaying(false);
		setContainerRepetition(originalRepetitions);
		setResetCounter(prev => prev + 1);
	}

	const activateTimer = () => {
		setIsPlaying(!isPlaying)

		//If this is the first time the timer_container is activated
		if (currentTimerIndex == -2) {
			setCurrentTimerIndex(0)
			setLastActiveTimer(0)
		}
		//If the timer_container is activated again
		else if (currentTimerIndex != -1) {
			setCurrentTimerIndex(-1)
		}

		else {
			let index = 0
			let firstActiveTimer = false

			while (index < timers.length && !firstActiveTimer) {

				if (!timers[index].hasFinished) {
					setCurrentTimerIndex(lastActiveTimer)
					setLastActiveTimer(index)
					firstActiveTimer = true
				}
				index += 1
			}
		}
	}

	const displayTimers =
		<SortableContext items={timers} strategy={verticalListSortingStrategy}>
			{timers.map((time, index) => (
				<div key={time.id}>
					<Timer
						id={time.id}
						time={time.duration}
						isActive={index == currentTimerIndex}
						onComplete={timerComplete}
						name={time.name}
						repetitions={time.repetitions}
						resetCounter={resetCounter}
					/>
					{isPlaying || !editing ? null :
						<button onClick={() => {
							setTimers(timers.filter(t => t.id !== time.id));
						}}>
							Remove Timer
						</button>
					}
				</div>
			))}
		</SortableContext>;

	const nameRef = useRef<HTMLInputElement>(null);

	useClickOutside(nameRef as React.RefObject<HTMLInputElement>, () => {
		setEditingName(false)
	})

	const getTimerPos = (id: number) => {
		return timers.findIndex(timer => timer.id == id)
	}

	const handleDragEnd = (event: { active: any; over: any; }) => {
		const { active, over } = event

		if (active.id == over.id) return;

		const originalPos = getTimerPos(active.id)
		const newPos = getTimerPos(over.id)

		const updatedList: TimerData[] = arrayMove(timers, originalPos, newPos)

		setTimers(updatedList)
	}

	if (editing) {
		return (
			<>
				<div className='containerDiv'>
					{editingName ? <input ref={nameRef} type="text" value={name} onChange={(e) => changeName(e.target.value, id)} /> : <h2 onClick={() => setEditingName(true)}>{name}</h2>}

					{visible ?
						<div className='containerDiv'>
							<div>
								Repetitions: {originalRepetitions}
							</div>
							<input type="number" min="0" placeholder='container repetitions' onChange={(e) => setOriginalRepetitions((Number(e.target.value)))} />
							<div>
								<h4>Add optional name of timer</h4>
								<input type="text" placeholder='optional name' onChange={(e) => setTimerName((e.target.value))} />
							</div>

							<div>
								<h4>Duration of timer</h4>
								<div style={{ display: 'flex', gap: '%', justifyContent: "center" }}>
									<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<p>Minutes</p>
										<input
											type="number"
											min="0"
											value={minutesToAdd}
											placeholder="minutes"
											onChange={(e) => {
												const val = e.target.value;
												setMinutesToAdd(val === '' ? 0 : Number(val));
											}}
										/>
									</div>

									<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<p>Seconds</p>
										<input
											type="number"
											min="0"
											value={secondsToAdd}
											placeholder="seconds"
											onChange={(e) => {
												const val = e.target.value;
												setSecondsToAdd(val === '' ? 0 : Number(val));
											}}
										/>
									</div>

									<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<p>Reps</p>
										<input
											type="number"
											min="0"
											placeholder="repetitions"
											onChange={(e) => {
												const val = e.target.value;
												setRepetitions(val === '' ? 1 : Number(val));
											}}
										/>
									</div>
								</div>
							</div>

							<div>
								<button onClick={addTimer}>Add time</button>
							</div>
							<div>
								<DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
									{displayTimers}
								</DndContext>
							</div>
							{isPlaying ? null : <button onClick={() => { setEditing(!editing), setContainerRepetition(originalRepetitions) }}>Exit editing</button>}
						</div>
						: null}
					{isPlaying ? null :
						<button onClick={() => { setVisible(!visible), whenOpen(id) }}>Open/Close container</button>
					}
				</div>
			</>
		)
	}

	return (
		<>
			<div className='containerDiv'>
				<h2>{name}</h2>
				{visible ?
					<div className='containerDiv'>
						X{containerRepetition}
						<button onClick={activateTimer}>Start/Stop</button>
						{displayTimers}

						{isPlaying ? null : <button onClick={() => { setEditing(!editing), setCurrentTimerIndex(-2), setLastActiveTimer(-2) }}>Edit</button>}
						{isPlaying ? null : <button onClick={resetTimer}>Reset timer</button>}
					</div>
					: null}
				{isPlaying ? null :
					<button onClick={() => { setVisible(!visible), whenOpen(id), setCurrentTimerIndex(-2), setLastActiveTimer(-2) }}>Open/Close container</button>
				}

			</div>
		</>
	)
}

export default TimerContainer