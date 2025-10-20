/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, DragEvent, ChangeEvent, useEffect, useMemo, KeyboardEvent, FormEvent } from 'react';
import { createRoot } from 'react-dom/client';

// --- TYPES ---
interface Student {
  id: number;
  name: string;
  studentId: string;
  grade: number | null;
  gpa: number;
}

interface Assignment {
    id: string;
    name: string;
    type: 'homework' | 'quiz' | 'test' | 'project' | 'exam' | 'extra-credit';
    maxPoints: number;
}

type Grades = Record<string, Record<number, Record<string, number | null>>>;
type GridCellContent = Student | null;
type View = 'seating-chart' | 'gradebook';


// --- CONSTANTS ---
const TOTAL_STUDENTS = 30;
const GRID_ROWS = 5;
const GRID_COLS = 6;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;
const GPA_BRACKETS = [4.00, 3.67, 3.33, 3.00, 2.67, 2.33, 2.00, 1.67, 1.33, 1.00, 0.67, 0.33, 0.00];
const FIRST_NAMES = ["Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Charlotte", "William", "Sophia", "James", "Amelia", "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Evelyn", "Alexander", "Harper"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const ASSIGNMENT_TYPES: Assignment['type'][] = ['homework', 'quiz', 'test', 'project', 'exam', 'extra-credit'];

const INITIAL_ASSIGNMENTS: Assignment[] = [
    { id: 'hw1', name: 'Homework 1', type: 'homework', maxPoints: 10 },
    { id: 'hw2', name: 'Homework 2', type: 'homework', maxPoints: 10 },
    { id: 'q1', name: 'Quiz 1', type: 'quiz', maxPoints: 25 },
    { id: 'hw3', name: 'Homework 3', type: 'homework', maxPoints: 10 },
    { id: 't1', name: 'Test 1', type: 'test', maxPoints: 50 },
    { id: 'p1', name: 'Project 1', type: 'project', maxPoints: 50 },
    { id: 'hw4', name: 'Homework 4', type: 'homework', maxPoints: 10 },
    { id: 'q2', name: 'Quiz 2', type: 'quiz', maxPoints: 25 },
    { id: 'ex1', name: 'Exam 1', type: 'exam', maxPoints: 100 },
    { id: 'hw5', name: 'Homework 5', type: 'homework', maxPoints: 10 },
    { id: 'q3', name: 'Quiz 3', type: 'quiz', maxPoints: 25 },
    { id: 'p2', name: 'Project 2', type: 'project', maxPoints: 50 },
    { id: 't2', name: 'Test 2', type: 'test', maxPoints: 50 },
    { id: 'hw6', name: 'Homework 6', type: 'homework', maxPoints: 10 },
    { id: 'ex2', name: 'Exam 2', type: 'exam', maxPoints: 100 },
    { id: 'ec', name: 'Extra Credit', type: 'extra-credit', maxPoints: 20 },
];


const CLASS_DATA: Record<string, string> = {
    "ITS-011a": "Intro to IT Systems",
    "ITS-034a": "IT Systems for Business",
    "ITS-034b": "IT Systems for Business",
    "ITS-101a": "Data and Databases for IT",
    "ENG-204a": "Technical Writing",
    "ETH-218a": "Ethics in Technology"
};

const gpaToGradeRangeMap: { [key: string]: { min: number; max: number } } = {
    '4.00': { min: 97, max: 100 },
    '3.67': { min: 93, max: 96 },
    '3.33': { min: 90, max: 92 },
    '3.00': { min: 87, max: 89 },
    '2.67': { min: 83, max: 86 },
    '2.33': { min: 80, max: 82 },
    '2.00': { min: 77, max: 79 },
    '1.67': { min: 73, max: 76 },
    '1.33': { min: 70, max: 72 },
    '1.00': { min: 67, max: 69 },
    '0.67': { min: 63, max: 66 },
    '0.33': { min: 60, max: 62 },
    '0.00': { min: 0, max: 59 },
};

// --- COLOR UTILITIES ---
const gradeToColor = (grade: number): string => {
  if (grade <= 50) return '#e74c3c'; // Red
  if (grade <= 70) {
    const percent = (grade - 50) / 20;
    const r = Math.round(231 + (241 - 231) * percent);
    const g = Math.round(76 + (196 - 76) * percent);
    const b = Math.round(60 + (15 - 60) * percent);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (grade <= 90) {
    const percent = (grade - 70) / 20;
    const r = Math.round(241 + (46 - 241) * percent);
    const g = Math.round(196 + (204 - 196) * percent);
    const b = Math.round(15 + (113 - 15) * percent);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const percent = Math.min(1, (grade - 90) / 10);
  const r = Math.round(46 + (52 - 46) * percent);
  const g = Math.round(204 + (152 - 204) * percent);
  const b = Math.round(113 + (219 - 113) * percent);
  return `rgb(${r}, ${g}, ${b})`;
};

const gpaToColor = (gpa: number): string => {
    if (gpa <= 2.0) return '#e74c3c'; // Red
    if (gpa <= 2.7) { 
        const percent = (gpa - 2.0) / 0.7;
        const r = Math.round(231 + (241 - 231) * percent);
        const g = Math.round(76 + (196 - 76) * percent);
        const b = Math.round(60 + (15 - 60) * percent);
        return `rgb(${r}, ${g}, ${b})`;
    }
    if (gpa <= 3.4) {
        const percent = (gpa - 2.7) / 0.7;
        const r = Math.round(241 + (46 - 241) * percent);
        const g = Math.round(196 + (204 - 196) * percent);
        const b = Math.round(15 + (113 - 15) * percent);
        return `rgb(${r}, ${g}, ${b})`;
    }
    const percent = Math.min(1, (gpa - 3.4) / 0.6);
    const r = Math.round(46 + (52 - 46) * percent);
    const g = Math.round(204 + (152 - 204) * percent);
    const b = Math.round(113 + (219 - 113) * percent);
    return `rgb(${r}, ${g}, ${b})`;
};

// --- GRADING & DATA VISUALIZATION CONSTANTS ---
const generateLetterGradeConfig = (): Record<string, { color: string }> => {
    const config: Record<string, { color: string }> = {};
    const gradeMidpoints: Record<string, number> = {
        'A+': 98, 'A': 95, 'A-': 91,
        'B+': 88, 'B': 85, 'B-': 81,
        'C+': 78, 'C': 75, 'C-': 71,
        'D+': 68, 'D': 65, 'D-': 61,
        'F': 40,
    };

    for (const grade in gradeMidpoints) {
        config[grade] = { color: gradeToColor(gradeMidpoints[grade]) };
    }
    config['N/A'] = { color: '#bdc3c7' };
    return config;
};

const LETTER_GRADE_CONFIG = generateLetterGradeConfig();

const GRADE_BRACKETS = [
    { grade: 'A+', min: 97 }, { grade: 'A', min: 93 }, { grade: 'A-', min: 90 },
    { grade: 'B+', min: 87 }, { grade: 'B', min: 83 }, { grade: 'B-', min: 80 },
    { grade: 'C+', min: 77 }, { grade: 'C', min: 73 }, { grade: 'C-', min: 70 },
    { grade: 'D+', min: 67 }, { grade: 'D', min: 63 }, { grade: 'D-', min: 60 },
    { grade: 'F', min: 0 }
];

const LEGEND_ORDER = Object.keys(LETTER_GRADE_CONFIG);

const gradeToLetterGrade = (percentage: number | null): string => {
    if (percentage === null || percentage === undefined) return 'N/A';
    for (const bracket of GRADE_BRACKETS) {
        if (percentage >= bracket.min) {
            return bracket.grade;
        }
    }
    return 'F';
};


// --- DATA GENERATION & CALCULATION ---
const calculateStudentGrade = (studentGrades: Record<string, number | null>, assignments: Assignment[]): number | null => {
    let totalPointsEarned = 0;
    let totalPointsPossible = 0;
    let extraCredit = 0;
    let hasGrades = false;

    for (const assignment of assignments) {
        const score = studentGrades?.[assignment.id];
        if (score !== null && score !== undefined) {
            hasGrades = true;
            if (assignment.type === 'extra-credit') {
                extraCredit += score;
            } else {
                totalPointsEarned += score;
                totalPointsPossible += assignment.maxPoints;
            }
        }
    }
    
    if (!hasGrades) return null;

    if (totalPointsPossible === 0) {
        return 100;
    }

    const finalGrade = ((totalPointsEarned + extraCredit) / totalPointsPossible) * 100;
    return Math.round(finalGrade);
};


const generateMockStudents = (count: number, startIndex: number, grades: Grades, classId: string, assignments: Assignment[]): Student[] => {
  return Array.from({ length: count }, (_, i): Student => {
    const uniqueIndex = startIndex + i;
    const id = uniqueIndex + 1;
    const studentGrades = grades?.[classId]?.[id] ?? {};
    const grade = calculateStudentGrade(studentGrades, assignments);
    const gpa = parseFloat((Math.random() * (4.0 - 1.5) + 1.5).toFixed(2));

    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return {
        id,
        name: `${firstName} ${lastName}`,
        studentId: `SID-${1000 + uniqueIndex + 1}`,
        grade,
        gpa,
    };
  });
};

const generateAllClassData = (grades: Grades, assignments: Assignment[]): Record<string, Student[]> => {
    const allData: Record<string, Student[]> = {};
    let studentCounter = 0;
    for (const classId of Object.keys(CLASS_DATA)) {
        allData[classId] = generateMockStudents(TOTAL_STUDENTS, studentCounter, grades, classId, assignments);
        studentCounter += TOTAL_STUDENTS;
    }
    return allData;
};


// --- UTILITIES ---
const findClosestGpaBracket = (gpa: number): number => {
    return GPA_BRACKETS.reduce((prev, curr) => 
        Math.abs(curr - gpa) < Math.abs(prev - gpa) ? curr : prev
    );
};

const gradeToGpaBracket = (grade: number): number => {
    for (const [gpa, range] of Object.entries(gpaToGradeRangeMap)) {
        if (grade >= range.min && grade <= range.max) {
            return parseFloat(gpa);
        }
    }
    return 0.00; // Default if not found in any range
};

const getIndicatorStatus = (student: Student): 'green' | 'red' | null => {
    if (student.grade === null) return null;
    const closestGpa = findClosestGpaBracket(student.gpa);
    const expectedRange = gpaToGradeRangeMap[closestGpa.toFixed(2)];
    
    if (!expectedRange) return null;

    if (student.grade > expectedRange.max) {
        return 'green';
    }
    if (student.grade < expectedRange.min) {
        return 'red';
    }
    return null;
};

// --- CHILD COMPONENTS ---

// FIX: Add props interface for PieSlice to resolve type errors.
interface PieSliceProps {
    percentage: number;
    color: string;
    radius: number;
    cx: number;
    cy: number;
    startPercent: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const PieSlice = ({ percentage, color, radius, cx, cy, startPercent, onMouseEnter, onMouseLeave }: PieSliceProps) => {
    const getCoordinatesForPercent = (p: number) => {
        const angle = (p * 2 * Math.PI) - (Math.PI / 2); // Start from 12 o'clock
        return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    };

    const endPercent = startPercent + percentage;
    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = percentage > 0.5 ? 1 : 0;

    const pathData = [
        `M ${cx} ${cy}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        'Z'
    ].join(' ');

    return <path d={pathData} fill={color} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className="pie-slice" />;
};

// FIX: Add props interface for GradeDistributionChartModal to resolve type errors.
interface GradeDistributionChartModalProps {
    chartData: {
        title: string;
        data: Record<string, number>;
    };
    onClose: () => void;
}

const GradeDistributionChartModal = ({ chartData, onClose }: GradeDistributionChartModalProps) => {
    const { title, data } = chartData;
    const [hoveredSlice, setHoveredSlice] = useState<{ label: string; value: number; percent: number } | null>(null);
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);

    if (total === 0) {
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="chart-modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                    <h2>{title}</h2>
                    <p>No grade data available for this assignment.</p>
                </div>
            </div>
        );
    }
    
    let cumulativePercent = 0;
    const slices = LEGEND_ORDER.filter(grade => data[grade] > 0).map(grade => {
        const value = data[grade];
        const percentage = value / total;
        const sliceInfo = {
            percentage,
            color: LETTER_GRADE_CONFIG[grade].color,
            startPercent: cumulativePercent,
            label: grade
        };
        cumulativePercent += percentage;
        return sliceInfo;
    });

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="chart-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>{title}</h2>
                <div className="pie-chart-container">
                    <svg viewBox="0 0 200 200" className="pie-chart-svg">
                        {slices.map(slice => (
                            <PieSlice
                                key={slice.label}
                                percentage={slice.percentage}
                                color={slice.color}
                                radius={80}
                                cx={100}
                                cy={100}
                                startPercent={slice.startPercent}
                                onMouseEnter={() => setHoveredSlice({ label: slice.label, value: data[slice.label], percent: slice.percentage * 100 })}
                                onMouseLeave={() => setHoveredSlice(null)}
                            />
                        ))}
                    </svg>
                    {hoveredSlice && (
                        <div className="pie-chart-tooltip">
                            <div><strong>{hoveredSlice.label}</strong></div>
                            <div>{hoveredSlice.value} Student{hoveredSlice.value > 1 ? 's' : ''}</div>
                            <div>({hoveredSlice.percent.toFixed(1)}%)</div>
                        </div>
                    )}
                    <div className="pie-chart-legend">
                        {LEGEND_ORDER.map(grade => {
                            const value = data[grade] || 0;
                            if (value === 0) return null;
                            return (
                                <div key={grade} className="legend-item">
                                    <span className="legend-color-box" style={{ backgroundColor: LETTER_GRADE_CONFIG[grade].color }}></span>
                                    <span className="legend-label">{grade}: {value} ({((value / total) * 100).toFixed(1)}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// FIX: Add props interface for StudentReportModal to resolve type errors.
interface StudentReportModalProps {
    student: Student;
    studentGrades: Record<string, number | null>;
    assignments: Assignment[];
    onClose: () => void;
    onShowAssignmentDistribution: (assignmentId: string) => void;
}

const StudentReportModal = ({ student, studentGrades, assignments, onClose, onShowAssignmentDistribution }: StudentReportModalProps) => {
    if (!student) return null;

    const chartData = assignments.map(assignment => {
        const score = studentGrades?.[assignment.id];
        const percentage = (score !== null && score !== undefined) ? (score / assignment.maxPoints) * 100 : null;
        return {
            id: assignment.id,
            name: assignment.name,
            score: score,
            maxPoints: assignment.maxPoints,
            percentage: percentage,
        };
    });

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>Progress Report: {student.name}</h2>
                <p>Student ID: {student.studentId}</p>
                <div className="student-report-chart">
                    {chartData.map((data, index) => (
                        <div key={index} className="chart-bar-container" onClick={() => onShowAssignmentDistribution(data.id)}>
                            <div className="bar-tooltip">{data.score !== null && data.score !== undefined ? `${data.score} / ${data.maxPoints}` : 'Not Graded'}</div>
                            <div 
                                className="chart-bar" 
                                style={{ 
                                    height: `${data.percentage ?? 0}%`, 
                                    backgroundColor: data.percentage !== null ? gradeToColor(data.percentage) : '#e0e0e0' 
                                }}
                            >
                            </div>
                            <div className="chart-label">{data.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (selectedClassIds: string[]) => void;
    allClassData: Record<string, string>;
}

const ExportModal = ({ isOpen, onClose, onExport, allClassData }: ExportModalProps) => {
    if (!isOpen) return null;

    const [selectedClasses, setSelectedClasses] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {};
        Object.keys(allClassData).forEach(id => {
            initialState[id] = true; // Default to all selected
        });
        return initialState;
    });

    const handleCheckboxChange = (classId: string) => {
        setSelectedClasses(prev => ({
            ...prev,
            [classId]: !prev[classId]
        }));
    };
    
    const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const newSelectedClasses: Record<string, boolean> = {};
        Object.keys(allClassData).forEach(id => {
            newSelectedClasses[id] = isChecked;
        });
        setSelectedClasses(newSelectedClasses);
    };

    const handleDownload = () => {
        const classIdsToExport = Object.keys(selectedClasses).filter(id => selectedClasses[id]);
        if (classIdsToExport.length > 0) {
            onExport(classIdsToExport);
        }
        onClose();
    };
    
    const areAllSelected = Object.values(selectedClasses).every(Boolean);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content export-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>Export Grades to CSV</h2>
                <p>Select the classes you want to include in the export.</p>
                <div className="class-checkbox-list">
                    <div className="checkbox-item select-all-item">
                        <input
                            type="checkbox"
                            id="select-all-classes"
                            checked={areAllSelected}
                            onChange={handleSelectAllChange}
                        />
                        <label htmlFor="select-all-classes">Select All</label>
                    </div>
                    {Object.entries(allClassData).map(([id, name]) => (
                        <div key={id} className="checkbox-item">
                            <input
                                type="checkbox"
                                id={`class-checkbox-${id}`}
                                checked={!!selectedClasses[id]}
                                onChange={() => handleCheckboxChange(id)}
                            />
                            <label htmlFor={`class-checkbox-${id}`}>{`${id} - ${name}`}</label>
                        </div>
                    ))}
                </div>
                <button className="export-download-button" onClick={handleDownload}>Download CSV</button>
            </div>
        </div>
    );
};


const Gradebook = ({ students, grades, assignments, onGradeChange, onClassChange, selectedClassId, onShowReport, onShowGradeDistribution, onExportClick, onAddAssignment }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [isAddFormVisible, setIsAddFormVisible] = useState(false);

    const [newName, setNewName] = useState('');
    const [newMaxPoints, setNewMaxPoints] = useState<number | ''>('');
    const [newType, setNewType] = useState<Assignment['type']>('homework');
    const [newPositionType, setNewPositionType] = useState('end');
    const [newPositionRef, setNewPositionRef] = useState('');

    const latestData = useRef({ students, grades, selectedClassId, assignments });
    latestData.current = { students, grades, selectedClassId, assignments };
    
    useEffect(() => {
        if (assignments.length > 0) {
            setNewPositionRef(assignments[assignments.length - 1].id);
        }
    }, [assignments]);

    const handleAddAssignmentClick = () => {
        setIsAddFormVisible(p => !p);
    };

    const handleCancelAddAssignment = () => {
        setIsAddFormVisible(false);
        setNewName('');
        setNewMaxPoints('');
        setNewType('homework');
        setNewPositionType('end');
    };

    const handleAddAssignmentSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newMaxPoints || Number(newMaxPoints) <= 0) {
            alert('Please enter a valid assignment name and positive max points.');
            return;
        }
        onAddAssignment({
            name: newName,
            maxPoints: Number(newMaxPoints),
            type: newType,
            positionType: newPositionType,
            positionReferenceId: newPositionRef,
        });
        handleCancelAddAssignment(); // Reset and close form
    };

    const handleInputChange = (studentId, assignmentId, value, maxPoints) => {
        const score = value === '' ? null : Math.max(0, Math.min(Number(value), maxPoints));
        onGradeChange(studentId, assignmentId, score);
    };
    
    const requestSort = (key: string, direction: 'asc' | 'desc') => {
        setSortConfig({ key, direction });
    };

    const sortedStudents = useMemo(() => {
        const { students: currentStudents } = latestData.current;
        
        let sortableItems = [...currentStudents];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue: string | number | null;
                let bValue: string | number | null;

                if (sortConfig.key === 'name') {
                    aValue = a.name;
                    bValue = b.name;
                } else if (sortConfig.key === 'overall') {
                    aValue = a.grade ?? -1;
                    bValue = b.grade ?? -1;
                } else { // It's an assignment ID
                    aValue = grades?.[selectedClassId]?.[a.id]?.[sortConfig.key] ?? -1;
                    bValue = grades?.[selectedClassId]?.[b.id]?.[sortConfig.key] ?? -1;
                }
    
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                
                const nameCompare = a.name.localeCompare(b.name);
                if (nameCompare !== 0) return nameCompare;
                return a.id - b.id;
            });
        }
        return sortableItems;
    }, [sortConfig, selectedClassId, students, grades]);

    const columnAverages = useMemo(() => {
        const { students: studentsInClass, assignments: currentAssignments } = latestData.current;
        if (!studentsInClass || studentsInClass.length === 0) {
            return { overall: null, assignments: {} };
        }

        const gradedStudents = studentsInClass.filter(s => s.grade !== null);
        const overallSum = gradedStudents.reduce((acc, s) => acc + (s.grade ?? 0), 0);
        const overallAvg = gradedStudents.length > 0 ? overallSum / gradedStudents.length : null;

        const assignmentAvgs: Record<string, number | null> = {};
        currentAssignments.forEach(assignment => {
            let sum = 0;
            let count = 0;
            studentsInClass.forEach(student => {
                const score = grades?.[selectedClassId]?.[student.id]?.[assignment.id];
                if (score !== null && score !== undefined) {
                    sum += score;
                    count++;
                }
            });
            const avgPercent = count > 0 ? (sum / count / assignment.maxPoints) * 100 : null;
            assignmentAvgs[assignment.id] = avgPercent;
        });

        return { overall: overallAvg, assignments: assignmentAvgs };
    }, [students, grades, selectedClassId, assignments]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, currentStudentIndex: number, assignmentId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextStudentIndex = currentStudentIndex + 1;
            if (nextStudentIndex < sortedStudents.length) {
                const nextStudent = sortedStudents[nextStudentIndex];
                const nextInputId = `grade-input-${nextStudent.id}-${assignmentId}`;
                const nextInput = document.getElementById(nextInputId);
                nextInput?.focus();
            }
        }
    };
    
    const isPositionRefDisabled = newPositionType !== 'before' && newPositionType !== 'after';

    return (
        <div className="gradebook-container">
            <div className="gradebook-controls">
                <div className="class-selector-control">
                    <label htmlFor="class-selector-gradebook">Class:</label>
                    <select id="class-selector-gradebook" value={selectedClassId} onChange={onClassChange}>
                        {Object.entries(CLASS_DATA).map(([id, name]) => (
                            <option key={id} value={id}>{`${id} - ${name}`}</option>
                        ))}
                    </select>
                </div>
                <div className="gradebook-actions">
                    <button className="add-assignment-button" onClick={handleAddAssignmentClick}>
                        {isAddFormVisible ? 'Cancel' : 'Add Assignment'}
                    </button>
                    <button className="export-csv-button" onClick={onExportClick}>Export to CSV</button>
                </div>
            </div>

            <div className={`add-assignment-pane ${isAddFormVisible ? 'open' : ''}`}>
                <form className="add-assignment-form" onSubmit={handleAddAssignmentSubmit}>
                    <h3>New Assignment</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="assignment-name">Name</label>
                            <input id="assignment-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Quiz 4" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="assignment-points">Max Points</label>
                            <input id="assignment-points" type="number" min="1" value={newMaxPoints} onChange={e => setNewMaxPoints(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 25" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="assignment-type">Type</label>
                            <select id="assignment-type" value={newType} onChange={e => setNewType(e.target.value as Assignment['type'])}>
                                {ASSIGNMENT_TYPES.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="assignment-position-type">Position</label>
                            <select id="assignment-position-type" value={newPositionType} onChange={e => setNewPositionType(e.target.value)}>
                                <option value="end">At the end</option>
                                <option value="start">At the start</option>
                                <option value="after">After...</option>
                                <option value="before">Before...</option>
                            </select>
                        </div>
                        <div className="form-group">
                             <label htmlFor="assignment-position-ref">Reference Assignment</label>
                            <select id="assignment-position-ref" value={newPositionRef} onChange={e => setNewPositionRef(e.target.value)} disabled={isPositionRefDisabled}>
                                {assignments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="form-save-button">Save Assignment</button>
                        <button type="button" className="form-cancel-button" onClick={handleCancelAddAssignment}>Cancel</button>
                    </div>
                </form>
            </div>

            <div className="gradebook-table-wrapper">
                <table className="gradebook-table">
                    <thead>
                        <tr>
                            <th className="sortable-header">
                                <div className="header-content">
                                    <div className="header-text">Student Name</div>
                                    <div className="sort-controls">
                                        <button 
                                            className={`sort-button ${sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'active' : ''}`} 
                                            onClick={() => requestSort('name', 'asc')}
                                            aria-label="Sort ascending by name"
                                        >
                                            <svg width="10" height="6" viewBox="0 0 10 6"><polygon points="5,0 10,5 0,5" /></svg>
                                        </button>
                                        <button 
                                            className={`sort-button ${sortConfig.key === 'name' && sortConfig.direction === 'desc' ? 'active' : ''}`} 
                                            onClick={() => requestSort('name', 'desc')}
                                            aria-label="Sort descending by name"
                                        >
                                            <svg width="10" height="6" viewBox="0 0 10 6"><polygon points="5,5 10,0 0,0" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </th>
                            <th className="sortable-header overall-grade-header" onDoubleClick={() => onShowGradeDistribution('overall')}>
                                <div className="header-content">
                                    <div className="header-text">Overall Grade</div>
                                    <div className="sort-controls">
                                        <button 
                                            className={`sort-button ${sortConfig.key === 'overall' && sortConfig.direction === 'asc' ? 'active' : ''}`} 
                                            onClick={() => requestSort('overall', 'asc')}
                                            aria-label="Sort ascending by overall grade"
                                        >
                                            <svg width="10" height="6" viewBox="0 0 10 6"><polygon points="5,0 10,5 0,5" /></svg>
                                        </button>
                                        <button 
                                            className={`sort-button ${sortConfig.key === 'overall' && sortConfig.direction === 'desc' ? 'active' : ''}`} 
                                            onClick={() => requestSort('overall', 'desc')}
                                            aria-label="Sort descending by overall grade"
                                        >
                                            <svg width="10" height="6" viewBox="0 0 10 6"><polygon points="5,5 10,0 0,0" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </th>
                            {assignments.map(assignment => (
                                <th key={assignment.id} className="sortable-header" onDoubleClick={() => onShowGradeDistribution(assignment.id)}>
                                    <div className="header-content">
                                        <div className="header-text">
                                            {assignment.name}
                                            <span>/ {assignment.maxPoints}</span>
                                        </div>
                                        <div className="sort-controls">
                                            <button 
                                                className={`sort-button ${sortConfig.key === assignment.id && sortConfig.direction === 'asc' ? 'active' : ''}`} 
                                                onClick={() => requestSort(assignment.id, 'asc')}
                                                aria-label={`Sort ascending by ${assignment.name}`}
                                            >
                                                <svg width="10" height="6" viewBox="0 0 10 6"><polygon points="5,0 10,5 0,5" /></svg>
                                            </button>
                                            <button 
                                                className={`sort-button ${sortConfig.key === assignment.id && sortConfig.direction === 'desc' ? 'active' : ''}`} 
                                                onClick={() => requestSort(assignment.id, 'desc')}
                                                aria-label={`Sort descending by ${assignment.name}`}
                                            >
                                                <svg width="10" height="6" viewBox="0 0 10 6"><polygon points="5,5 10,0 0,0" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map((student, studentIndex) => (
                            <tr key={student.id}>
                                <th className="clickable-student-name" onClick={() => onShowReport(student)}>{student.name}</th>
                                <td className="overall-grade-cell">
                                    {student.grade !== null ? `${student.grade}%` : 'N/A'}
                                </td>
                                {assignments.map(assignment => (
                                    <td key={assignment.id}>
                                        <input
                                            id={`grade-input-${student.id}-${assignment.id}`}
                                            type="number"
                                            min="0"
                                            max={assignment.maxPoints}
                                            value={grades?.[selectedClassId]?.[student.id]?.[assignment.id] ?? ''}
                                            onChange={(e) => handleInputChange(student.id, assignment.id, e.target.value, assignment.maxPoints)}
                                            onKeyDown={(e) => handleKeyDown(e, studentIndex, assignment.id)}
                                            placeholder="-"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="average-row">
                            <th>Class Average</th>
                            <td className="overall-grade-cell">
                                {columnAverages.overall !== null ? `${columnAverages.overall.toFixed(1)}%` : 'N/A'}
                            </td>
                            {assignments.map(assignment => (
                                <td key={assignment.id}>
                                    {columnAverages.assignments[assignment.id] !== null ? `${columnAverages.assignments[assignment.id]!.toFixed(1)}%` : 'N/A'}
                                </td>
                             ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

const SeatingChart = ({ students, seatingChart, setSeatingChart, gradeRange, handleGradeChange, viewMode, handleViewModeToggle, isAnonymized, handleAnonymizeToggle, onShowReport }) => {
    const draggedStudent = useRef<{ student: Student; fromIndex: number } | null>(null);
    const [hoveredIndicator, setHoveredIndicator] = useState<number | null>(null);

    const handleDragStart = (e: DragEvent<HTMLDivElement>, student: Student, fromIndex: number) => {
        draggedStudent.current = { student, fromIndex };
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => { (e.target as HTMLDivElement).classList.add('dragging'); }, 0);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.currentTarget.classList.add('over'); };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.currentTarget.classList.remove('over'); };
    const handleDragEnd = (e: DragEvent<HTMLDivElement>) => { (e.target as HTMLDivElement).classList.remove('dragging'); };

    const handleDrop = (e: DragEvent<HTMLDivElement>, toIndex: number) => {
        e.preventDefault();
        e.currentTarget.classList.remove('over');
        if (!draggedStudent.current) return;
        const { student: dragged, fromIndex } = draggedStudent.current;
        const newSeatingChart = [...seatingChart];
        const studentAtTarget = newSeatingChart[toIndex];
        newSeatingChart[toIndex] = dragged;
        newSeatingChart[fromIndex] = studentAtTarget;
        setSeatingChart(newSeatingChart);
        draggedStudent.current = null;
    };

    return (
        <>
            <div className="filter-container">
                <div className="controls-wrapper">
                    <div className="toggle-control">
                        <span className={`toggle-label ${isAnonymized ? 'active' : ''}`}>Anonymize</span>
                        <label className="toggle-switch"><input type="checkbox" checked={isAnonymized} onChange={handleAnonymizeToggle} /><span className="toggle-slider"></span></label>
                    </div>
                    <div className="slider-control">
                        <div className="dual-slider-labels">
                            <span>Min: {viewMode === 'grade' ? `${gradeRange.min}%` : gradeRange.min.toFixed(2)}</span>
                            <span>Max: {viewMode === 'grade' ? `${gradeRange.max}%` : gradeRange.max.toFixed(2)}</span>
                        </div>
                        <div className="dual-slider-container">
                            <div className="slider-track"></div>
                            <div className="slider-range-fill" style={{ left: `${viewMode === 'grade' ? gradeRange.min : (gradeRange.min - 1.5) / 0.025}%`, right: `${viewMode === 'grade' ? 100 - gradeRange.max : 100 - (gradeRange.max - 1.5) / 0.025}%` }}></div>
                            <input type="range" name="min" className="slider" min={viewMode === 'grade' ? 0 : 1.5} max={viewMode === 'grade' ? 100 : 4.0} step={viewMode === 'grade' ? 1 : 0.01} value={gradeRange.min} onChange={handleGradeChange} />
                            <input type="range" name="max" className="slider" min={viewMode === 'grade' ? 0 : 1.5} max={viewMode === 'grade' ? 100 : 4.0} step={viewMode === 'grade' ? 1 : 0.01} value={gradeRange.max} onChange={handleGradeChange} />
                        </div>
                    </div>
                    <div className="toggle-control">
                        <span className={`toggle-label ${viewMode === 'grade' ? 'active' : ''}`}>Grade</span>
                        <label className="toggle-switch"><input type="checkbox" checked={viewMode === 'gpa'} onChange={handleViewModeToggle} /><span className="toggle-slider"></span></label>
                        <span className={`toggle-label ${viewMode === 'gpa' ? 'active' : ''}`}>GPA</span>
                    </div>
                </div>
            </div>
            <div className="seating-chart">
                {seatingChart.map((student, index) => {
                    const studentValue = viewMode === 'grade' ? student?.grade : student?.gpa;
                    const isOutOfRange = student && studentValue !== null && (studentValue < gradeRange.min || studentValue > gradeRange.max);
                    const indicatorStatus = student ? getIndicatorStatus(student) : null;
                    const expectedRange = student ? gpaToGradeRangeMap[findClosestGpaBracket(student.gpa).toFixed(2)] : null;
                    const currentGradeGpa = student?.grade !== null ? gradeToGpaBracket(student.grade) : null;

                    return (
                        <div key={student ? `student-${student.id}` : `empty-${index}`} className="grid-cell" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, index)}>
                            {student ? (
                                <div className={`student-card ${isOutOfRange ? 'out-of-range' : ''}`} draggable onDragStart={(e) => handleDragStart(e, student, index)} onDragEnd={handleDragEnd} onDoubleClick={() => onShowReport(student)} style={{ backgroundColor: viewMode === 'grade' ? (student.grade !== null ? gradeToColor(student.grade) : '#cccccc') : gpaToColor(student.gpa) }}>
                                    <div className="student-name">{isAnonymized ? `Student ${student.studentId.split('-')[1]}` : student.name}</div>
                                    <div className="student-id">{student.studentId}</div>
                                    <div className="student-grade">Grade: {student.grade !== null ? `${student.grade}%` : 'N/A'}</div>
                                    <div className="student-grade">GPA: {student.gpa.toFixed(2)}</div>
                                    {indicatorStatus && (
                                        <div className="indicator-container" onMouseEnter={() => setHoveredIndicator(student.id)} onMouseLeave={() => setHoveredIndicator(null)}>
                                            <div className={`grade-indicator indicator-${indicatorStatus}`}>!</div>
                                            {hoveredIndicator === student.id && (
                                                <div className="indicator-tooltip">
                                                    <p>Expected Grade (GPA {student.gpa.toFixed(2)}): {expectedRange?.min}% - {expectedRange?.max}%</p>
                                                    <p>Current Grade GPA: {currentGradeGpa !== null ? currentGradeGpa.toFixed(2) : 'N/A'}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (<div className="empty-cell"></div>)}
                        </div>
                    );
                })}
            </div>
        </>
    );
}


// --- MAIN APP COMPONENT ---
const App = () => {
    const [currentView, setCurrentView] = useState<View>('seating-chart');
    const [selectedClassId, setSelectedClassId] = useState<string>(Object.keys(CLASS_DATA)[0]);
    const [seatingChart, setSeatingChart] = useState<GridCellContent[]>([]);
    const [grades, setGrades] = useState<Grades>({});
    const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
    const [gradeRange, setGradeRange] = useState({ min: 0, max: 100 });
    const [viewMode, setViewMode] = useState<'grade' | 'gpa'>('grade');
    const [isAnonymized, setIsAnonymized] = useState(false);
    const [modalStudent, setModalStudent] = useState<Student | null>(null);
    const [isDebugMenuOpen, setIsDebugMenuOpen] = useState(false);
    const [chartData, setChartData] = useState<{ title: string; data: Record<string, number> } | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const debugMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedGradesJSON = localStorage.getItem('allStudentGrades');
        if (savedGradesJSON) {
            try {
                const parsedData = JSON.parse(savedGradesJSON);
                if (typeof parsedData !== 'object' || Array.isArray(parsedData) || parsedData === null) {
                    console.warn("Skipping loading of malformed or legacy grades data from localStorage.");
                    return;
                }

                const parsedGrades = parsedData as Record<string, unknown>;
                const correctedGrades: Grades = {};

                for (const classId in parsedGrades) {
                    if (Object.prototype.hasOwnProperty.call(parsedGrades, classId)) {
                        correctedGrades[classId] = {};
                        const studentGrades = parsedGrades[classId] as Record<string, any>;
                        if (typeof studentGrades !== 'object' || studentGrades === null) continue;

                        for (const studentIdStr in studentGrades) {
                            if (Object.prototype.hasOwnProperty.call(studentGrades, studentIdStr)) {
                                const studentIdNum = parseInt(studentIdStr, 10);
                                if (!isNaN(studentIdNum)) {
                                    correctedGrades[classId][studentIdNum] = studentGrades[studentIdStr];
                                }
                            }
                        }
                    }
                }
                setGrades(correctedGrades);
            } catch (e) {
                console.error("Failed to parse grades from localStorage", e);
            }
        }
    }, []);

    const stableClassStudents = useMemo(() => {
        return generateAllClassData({}, []); // Pass empty assignments initially
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (debugMenuRef.current && !debugMenuRef.current.contains(event.target as Node)) {
                setIsDebugMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allClassStudents = useMemo(() => {
        const updatedStudents: Record<string, Student[]> = {};
        for (const classId in stableClassStudents) {
            if (Object.prototype.hasOwnProperty.call(stableClassStudents, classId)) {
                updatedStudents[classId] = stableClassStudents[classId].map(student => ({
                    ...student,
                    grade: calculateStudentGrade(grades?.[classId]?.[student.id] ?? {}, assignments)
                }));
            }
        }
        return updatedStudents;
    }, [grades, stableClassStudents, assignments]);
    
    useEffect(() => {
        const studentsForClass = allClassStudents[selectedClassId];
        if (!studentsForClass) return;

        const savedLayoutKey = `seatingChart-${selectedClassId}`;
        const savedLayoutJSON = localStorage.getItem(savedLayoutKey);
        let initialGrid: GridCellContent[] = Array(TOTAL_CELLS).fill(null);

        if (savedLayoutJSON) {
            try {
                const savedStudentIds: (number | null)[] = JSON.parse(savedLayoutJSON);
                const studentMap = new Map(studentsForClass.map(s => [s.id, s]));
                initialGrid = savedStudentIds.map(id => id ? (studentMap.get(id) || null) : null);
            } catch (e) {
                console.error("Failed to parse seating chart", e);
                studentsForClass.slice(0, TOTAL_CELLS).forEach((s, i) => { initialGrid[i] = s; });
            }
        } else {
            studentsForClass.slice(0, TOTAL_CELLS).forEach((s, i) => { initialGrid[i] = s; });
        }
        setSeatingChart(initialGrid);
    }, [selectedClassId, allClassStudents]);

    useEffect(() => {
        if (seatingChart.length === 0) return;
        const studentIdsToSave = seatingChart.map(cell => cell ? cell.id : null);
        localStorage.setItem(`seatingChart-${selectedClassId}`, JSON.stringify(studentIdsToSave));
    }, [seatingChart, selectedClassId]);

    useEffect(() => {
        localStorage.setItem('allStudentGrades', JSON.stringify(grades));
    }, [grades]);

    const handleGradeRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let newMin = gradeRange.min; let newMax = gradeRange.max;
        if (name === 'min') newMin = Math.min(Number(value), gradeRange.max);
        else newMax = Math.max(Number(value), gradeRange.min);
        setGradeRange({ min: newMin, max: newMax });
    };

    const handleViewModeToggle = () => {
        setViewMode(prevMode => {
            const newMode = prevMode === 'grade' ? 'gpa' : 'grade';
            if (newMode === 'gpa') {
                setGradeRange({ min: 1.5, max: 4.0 });
            } else {
                setGradeRange({ min: 0, max: 100 });
            }
            return newMode;
        });
    };
    
    const handleClassChange = (e: ChangeEvent<HTMLSelectElement>) => setSelectedClassId(e.target.value);

    const handleGradeInputChange = (studentId: number, assignmentId: string, score: number | null) => {
        setGrades(prevGrades => ({
            ...prevGrades,
            [selectedClassId]: {
                ...(prevGrades[selectedClassId] || {}),
                [studentId]: {
                    ...(prevGrades[selectedClassId]?.[studentId] || {}),
                    [assignmentId]: score,
                },
            },
        }));
    };
    
    const handleShowReport = (student: Student) => setModalStudent(student);
    const handleCloseReport = () => setModalStudent(null);
    
    const handlePopulateGrades = () => {
        const newGrades: Grades = {};
        for (const classId in stableClassStudents) {
            newGrades[classId] = {};
            for (const student of stableClassStudents[classId]) {
                newGrades[classId][student.id] = {};
                const targetGradePercent = 0.6 + Math.random() * 0.4;

                for (const assignment of assignments) {
                    const scoreVariance = (Math.random() - 0.5) * 0.4;
                    let scorePercent = targetGradePercent + scoreVariance;
                    scorePercent = Math.max(0, Math.min(1, scorePercent));
                    const score = Math.round(scorePercent * assignment.maxPoints);
                    newGrades[classId][student.id][assignment.id] = score;
                }
            }
        }
        setGrades(newGrades);
        setIsDebugMenuOpen(false);
    };

    const handleClearData = () => {
        setGrades({});
        setIsDebugMenuOpen(false);
    };
    
    const handleShowGradeDistribution = (assignmentId: string) => {
        const students = allClassStudents[selectedClassId];
        const gradeCounts: Record<string, number> = {};
        
        LEGEND_ORDER.forEach(grade => { gradeCounts[grade] = 0; });

        let chartTitle = '';

        if (assignmentId === 'overall') {
            chartTitle = 'Overall Grade Distribution';
            students.forEach(student => {
                const letterGrade = gradeToLetterGrade(student.grade);
                gradeCounts[letterGrade]++;
            });
        } else {
            const assignment = assignments.find(a => a.id === assignmentId);
            if (!assignment) return;
            chartTitle = `Grade Distribution: ${assignment.name}`;
            
            students.forEach(student => {
                const score = grades?.[selectedClassId]?.[student.id]?.[assignmentId];
                const percentage = (score !== null && score !== undefined)
                    ? (score / assignment.maxPoints) * 100
                    : null;
                const letterGrade = gradeToLetterGrade(percentage);
                gradeCounts[letterGrade]++;
            });
        }
        setChartData({ title: chartTitle, data: gradeCounts });
    };

    const handleAddAssignment = (newAssignmentData: { name: string; maxPoints: number; type: Assignment['type']; positionType: string; positionReferenceId: string; }) => {
        const { name, maxPoints, type, positionType, positionReferenceId } = newAssignmentData;

        const newAssignment: Assignment = {
            id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name,
            type,
            maxPoints
        };

        setAssignments(prevAssignments => {
            const newAssignments = [...prevAssignments];
            if (positionType === 'start') {
                newAssignments.unshift(newAssignment);
            } else if ((positionType === 'before' || positionType === 'after') && positionReferenceId) {
                const refIndex = newAssignments.findIndex(a => a.id === positionReferenceId);
                if (refIndex !== -1) {
                    const insertIndex = positionType === 'after' ? refIndex + 1 : refIndex;
                    newAssignments.splice(insertIndex, 0, newAssignment);
                } else { // fallback to end
                    newAssignments.push(newAssignment);
                }
            } else { // 'end' or fallback
                newAssignments.push(newAssignment);
            }
            return newAssignments;
        });
    };
    
    const handleExportData = (classIdsToExport: string[]) => {
        const headers = ['Student Name', 'Student ID', ...assignments.map(a => a.name)];
        
        const escapeCsv = (str: string | number | null): string => {
            if (str === null || str === undefined) return '';
            const stringVal = String(str);
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        };
        
        let csvContent = headers.map(escapeCsv).join(',') + '\r\n';
        
        classIdsToExport.forEach(classId => {
            const className = CLASS_DATA[classId];
            csvContent += `"${classId} - ${className}"\r\n`;

            const studentsInClass = allClassStudents[classId];
            if (studentsInClass) {
                studentsInClass.forEach(student => {
                    const row = [
                        student.name,
                        student.studentId,
                        ...assignments.map(assignment => {
                            return grades?.[classId]?.[student.id]?.[assignment.id] ?? null;
                        })
                    ];
                    csvContent += row.map(escapeCsv).join(',') + '\r\n';
                });
            }
            csvContent += '\r\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'grades-export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    return (
        <>
            <div className="main-controls">
                <div className="main-controls-left">
                    <div className="class-selector-control">
                        <label htmlFor="class-selector-main">Class:</label>
                        <select id="class-selector-main" value={selectedClassId} onChange={handleClassChange} disabled={currentView === 'gradebook'}>
                            {Object.entries(CLASS_DATA).map(([id, name]) => (
                                <option key={id} value={id}>{`${id} - ${name}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="debug-menu-container" ref={debugMenuRef}>
                        <button className="debug-menu-button" onClick={() => setIsDebugMenuOpen(p => !p)}>
                            Debug Menu
                        </button>
                        {isDebugMenuOpen && (
                            <ul className="debug-dropdown">
                                <li onClick={handlePopulateGrades}>Populate Grades</li>
                                <li onClick={handleClearData}>Clear Data</li>
                            </ul>
                        )}
                    </div>
                </div>
                <button className="view-toggle-button" onClick={() => setCurrentView(v => v === 'seating-chart' ? 'gradebook' : 'seating-chart')}>
                    {currentView === 'seating-chart' ? 'Go to Gradebook' : 'Go to Seating Chart'}
                </button>
            </div>
            
            {currentView === 'seating-chart' ? (
                <SeatingChart
                    students={allClassStudents[selectedClassId] || []}
                    seatingChart={seatingChart}
                    setSeatingChart={setSeatingChart}
                    gradeRange={gradeRange}
                    handleGradeChange={handleGradeRangeChange}
                    viewMode={viewMode}
                    handleViewModeToggle={handleViewModeToggle}
                    isAnonymized={isAnonymized}
                    handleAnonymizeToggle={() => setIsAnonymized(p => !p)}
                    onShowReport={handleShowReport}
                />
            ) : (
                <Gradebook 
                    students={allClassStudents[selectedClassId] || []}
                    grades={grades}
                    assignments={assignments}
                    onGradeChange={handleGradeInputChange}
                    selectedClassId={selectedClassId}
                    onClassChange={handleClassChange}
                    onShowReport={handleShowReport}
                    onShowGradeDistribution={handleShowGradeDistribution}
                    onExportClick={() => setIsExportModalOpen(true)}
                    onAddAssignment={handleAddAssignment}
                />
            )}

            {modalStudent && (
                <StudentReportModal 
                    student={modalStudent}
                    studentGrades={grades?.[selectedClassId]?.[modalStudent.id] ?? {}}
                    assignments={assignments}
                    onClose={handleCloseReport}
                    onShowAssignmentDistribution={handleShowGradeDistribution}
                />
            )}
            
            {chartData && (
                <GradeDistributionChartModal
                    chartData={chartData}
                    onClose={() => setChartData(null)}
                />
            )}

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExportData}
                allClassData={CLASS_DATA}
            />
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);