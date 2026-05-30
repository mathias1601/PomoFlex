'use client'
import React, { CSSProperties, useContext, useEffect, useRef, useState } from 'react'

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { useAlarmSoundContext } from '../contexts/AlarmSoundContext';

interface Props {
	id: number,
	time: number,
	isActive: boolean,
	onComplete: () => void, //Tells the TimerContainer when the timer has finished
	name?: string,
	repetitions: number,
	resetCounter: number
}

const Timer = ({ id, time, isActive, onComplete, name = "", repetitions = 1, resetCounter }: Props) => {

	//For drag-n-drop
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

	const [remaining, setRemaining] = useState<number>(time)
	const originalTime = time //The initial amount of time when component was created

	const [repeat, setRepeat] = useState<number>(repetitions)

	//If the timer is finished
	const [done, setDone] = useState<boolean>(false);

	//Playing the alarm
	const alarmContext = useAlarmSoundContext();
	const alarmRef = useRef<HTMLAudioElement | null>(null);

	//When timers are reset
	useEffect(() => {
		setRemaining(time);
		setRepeat(repetitions);
		setDone(false);
	}, [time, repetitions, resetCounter]);

	useEffect(() => {
		alarmRef.current = new Audio(alarmContext.alarmUrl);
		alarmRef.current.load();
	}, [alarmContext.alarmUrl])

	const playAlarm = () => {
		if (alarmRef.current) {
			alarmRef.current.play();
		}
	}

	const stopAlarm = () => {
		if (alarmRef.current) {
			alarmRef.current.pause();
			alarmRef.current.currentTime = 0;
		}
	}

	const minutes = Math.floor(remaining / 60);
	const seconds = remaining % 60;

	useEffect(() => {
		if (!isActive) return;

		if (remaining <= 0 && repeat > 1) {
			setRepeat(repeat - 1)
			setRemaining(originalTime)
		}

		if (remaining <= 0 && repeat <= 1 && repeat > 0) {
			setRepeat(repeat - 1)
			setDone(true)
			stopAlarm()
			playAlarm()
			onComplete();
			return;
		}

		//Check this portion further
		const interval = setInterval(() => {
			setRemaining((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isActive, remaining]);

	const timerStyleActive: CSSProperties = {
		padding: '1rem',
		borderRadius: '0.75rem',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
		backgroundColor: 'white',
		maxWidth: '250px',
		margin: '1rem auto',
		textAlign: 'center',
	}

	const timerStyleUnactive: CSSProperties = {
		padding: '1rem',
		borderRadius: '0.75rem',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
		backgroundColor: 'red',
		maxWidth: '250px',
		margin: '1rem auto',
		textAlign: 'center',
	}

	const timerStyle = done ? timerStyleUnactive : timerStyleActive;

	const dragNDropStyle = {
		transition,
		transform: CSS.Transform.toString(transform),
	}

	return (
		<>
			<div ref={setNodeRef} {...attributes} {...listeners} style={dragNDropStyle}>
				<div style={timerStyle}>
					<h2>{name}</h2>
					<h2>
						{`${minutes}: 
							${seconds < 10 ? `0${seconds}` : seconds}
						`}
					</h2>
					<p>X {repeat}</p>
				</div>
			</div>
		</>
	)
}

export default Timer