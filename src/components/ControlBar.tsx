import { Box, Card, IconButton, Paper, Snackbar, Typography } from '@mui/material'
import { PlayCircleFilledWhite, PauseCircleOutline as PauseCircleOutlineIcon, StopCircle as StopCircleIcon, SkipNext as SkipNextIcon, SkipPrevious as SkipPreviousIcon } from '@mui/icons-material'
import CloseIcon from '@mui/icons-material/Close'
import { useState } from 'react'
interface ControlBarProps {
    playScene: boolean
    setPlayScene: React.Dispatch<React.SetStateAction<boolean>>
    currentLineIndex: number
    setCurrentLineIndex: React.Dispatch<React.SetStateAction<number>>
}

export default function ControlBar({ playScene, setPlayScene, currentLineIndex, setCurrentLineIndex }: ControlBarProps) {
    const [snackbar, setSnackbar] = useState(false)
    const [snackbarMsg, setSnackbarMsg] = useState('')
    const handleClick = (message: string) => {
        setSnackbarMsg(message)
        setSnackbar(true)
    }
    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return
        }
        setSnackbar(false)
    }

    const snackbarAction = () => {
        return (
            <Box>
                <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        )
    }
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Snackbar open={snackbar} autoHideDuration={3000} onClose={handleClose} action={snackbarAction()} message={snackbarMsg} />
            <Card>
                <IconButton
                    onClick={() => {
                        handleClick('play button clicked')
                        if (!playScene) {
                            setPlayScene(true)
                        }
                    }}>
                    {playScene === false ? <PlayCircleFilledWhite /> : <PauseCircleOutlineIcon />}
                </IconButton>
                {/* <IconButton onClick={() => setPlayScene(!playScene)}>{playScene === false ? <PlayCircleFilledWhite /> : <PauseCircleOutlineIcon />}</IconButton> */}
            </Card>
            <Card>
                <IconButton
                    onClick={() => {
                        handleClick('stop playback clicked')
                        setCurrentLineIndex(0)
                        if (playScene) setPlayScene(false)
                    }}>
                    <StopCircleIcon />
                </IconButton>
            </Card>
            <Card>
                <IconButton
                    onClick={() => {
                        handleClick('skip to prev line clicked')
                        setCurrentLineIndex(currentLineIndex - 1)
                    }}>
                    <SkipPreviousIcon />
                </IconButton>
            </Card>
            <Card>
                <IconButton
                    onClick={() => {
                        handleClick('skip to next line clicked')
                        setCurrentLineIndex(currentLineIndex + 1)
                    }}>
                    <SkipNextIcon />
                </IconButton>
            </Card>
        </Box>
    )
}
