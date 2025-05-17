import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from "chart.js";
import { Line } from "react-chartjs-2";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Reusable components
const Card = ({ title, children, className }) => (
  <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
    <div className="px-6 py-4">
      <div className="font-bold text-xl mb-2">{title}</div>
      {children}
    </div>
  </div>
);

const Button = ({ onClick, className, disabled, children, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded font-semibold ${
      disabled
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700 text-white"
    } ${className}`}
  >
    {children}
  </button>
);

const FormField = ({ label, name, register, error, type = "text", ...rest }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>
      {label}
    </label>
    <input
      id={name}
      type={type}
      className={`shadow appearance-none border ${
        error ? "border-red-500" : ""
      } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500`}
      {...register(name)}
      {...rest}
    />
    {error && <p className="text-red-500 text-xs italic">{error.message}</p>}
  </div>
);

const Loading = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Navigation
const Navbar = () => {
  return (
    <nav className="bg-gray-800 py-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <Link to="/" className="text-white text-xl font-bold">Health Tracker</Link>
        <div className="flex space-x-4">
          <Link to="/" className="text-gray-300 hover:text-white">Dashboard</Link>
          <Link to="/weight" className="text-gray-300 hover:text-white">Weight</Link>
          <Link to="/measurements" className="text-gray-300 hover:text-white">Measurements</Link>
          <Link to="/health-markers" className="text-gray-300 hover:text-white">Health Markers</Link>
          <Link to="/supplements" className="text-gray-300 hover:text-white">Supplements</Link>
          <Link to="/peptides" className="text-gray-300 hover:text-white">Peptides</Link>
        </div>
      </div>
    </nav>
  );
};

// Dashboard
const Dashboard = () => {
  const [weightData, setWeightData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const weightResponse = await axios.get(`${API}/body-composition`);
        setWeightData(weightResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = {
    labels: weightData.slice(0, 10).map(entry => dayjs(entry.date).format('MMM D')).reverse(),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: weightData.slice(0, 10).map(entry => entry.weight).reverse(),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weight Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Health Dashboard</h1>
      
      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Weight Trend" className="col-span-2">
            {weightData.length > 0 ? (
              <div className="h-72">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <p>No weight data available. Add your first weight entry to see trends.</p>
            )}
          </Card>
          
          <Card title="Quick Actions">
            <div className="flex flex-col space-y-4">
              <Link to="/weight/add" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center">
                Add Weight Entry
              </Link>
              <Link to="/health-markers/add" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center">
                Log Health Markers
              </Link>
              <Link to="/measurements/add" className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-center">
                Record Body Measurements
              </Link>
            </div>
          </Card>
          
          <Card title="Recent Stats">
            {weightData.length > 0 ? (
              <div>
                <p className="text-lg">
                  Latest Weight: <span className="font-bold">{weightData[0].weight} lbs</span> on {dayjs(weightData[0].date).format('MMM D, YYYY')}
                </p>
                {weightData[0].body_fat_percentage && (
                  <p className="text-lg mt-2">
                    Body Fat: <span className="font-bold">{weightData[0].body_fat_percentage}%</span>
                  </p>
                )}
                {weightData[0].muscle_mass && (
                  <p className="text-lg mt-2">
                    Muscle Mass: <span className="font-bold">{weightData[0].muscle_mass} lbs</span>
                  </p>
                )}
              </div>
            ) : (
              <p>No recent stats available.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

// Weight & Body Composition
const WeightList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/body-composition`);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching weight data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`${API}/body-composition/${id}`);
        setData(data.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Weight & Body Composition</h1>
        <Link to="/weight/add" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Entry
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Weight (lbs)</th>
                <th className="py-2 px-4 text-left">Body Fat %</th>
                <th className="py-2 px-4 text-left">Muscle Mass</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="py-2 px-4">{dayjs(entry.date).format('MMM D, YYYY')}</td>
                  <td className="py-2 px-4">{entry.weight}</td>
                  <td className="py-2 px-4">{entry.body_fat_percentage || '-'}</td>
                  <td className="py-2 px-4">{entry.muscle_mass || '-'}</td>
                  <td className="py-2 px-4 flex space-x-2">
                    <Link to={`/weight/edit/${entry.id}`} className="text-blue-500 hover:text-blue-700">
                      Edit
                    </Link>
                    <button 
                      onClick={() => deleteEntry(entry.id)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No weight entries found. Add your first entry to get started!</p>
      )}
    </div>
  );
};

const WeightForm = ({ isEdit = false }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const entryId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${API}/body-composition/${entryId}`);
          const entry = response.data;
          
          // Format date to YYYY-MM-DD for the date input
          setValue('date', dayjs(entry.date).format('YYYY-MM-DD'));
          setValue('weight', entry.weight);
          setValue('body_fat_percentage', entry.body_fat_percentage);
          setValue('muscle_mass', entry.muscle_mass);
          setValue('water_percentage', entry.water_percentage);
          setValue('bone_mass', entry.bone_mass);
          setValue('bmi', entry.bmi);
          setValue('notes', entry.notes);
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching entry data:', error);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isEdit, entryId, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/body-composition/${entryId}`, data);
      } else {
        await axios.post(`${API}/body-composition`, data);
      }
      navigate('/weight');
    } catch (error) {
      console.error('Error saving data:', error);
      setSubmitting(false);
      alert('An error occurred while saving. Please try again.');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Weight Entry</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <FormField
          label="Date"
          name="date"
          type="date"
          register={register}
          error={errors.date}
          defaultValue={dayjs().format('YYYY-MM-DD')}
          required
        />
        
        <FormField
          label="Weight (lbs)"
          name="weight"
          type="number"
          step="0.1"
          register={register}
          error={errors.weight}
          required
        />
        
        <FormField
          label="Body Fat Percentage"
          name="body_fat_percentage"
          type="number"
          step="0.1"
          register={register}
          error={errors.body_fat_percentage}
        />
        
        <FormField
          label="Muscle Mass (lbs)"
          name="muscle_mass"
          type="number"
          step="0.1"
          register={register}
          error={errors.muscle_mass}
        />
        
        <FormField
          label="Water Percentage"
          name="water_percentage"
          type="number"
          step="0.1"
          register={register}
          error={errors.water_percentage}
        />
        
        <FormField
          label="Bone Mass (lbs)"
          name="bone_mass"
          type="number"
          step="0.1"
          register={register}
          error={errors.bone_mass}
        />
        
        <FormField
          label="BMI"
          name="bmi"
          type="number"
          step="0.1"
          register={register}
          error={errors.bmi}
        />
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            {...register('notes')}
          ></textarea>
        </div>
        
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
          
          <Button
            className="bg-gray-500 hover:bg-gray-700"
            onClick={() => navigate('/weight')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

// Body Measurements
const MeasurementsForm = ({ isEdit = false }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const measurementId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${API}/body-measurements/${measurementId}`);
          const entry = response.data;
          
          setValue('date', dayjs(entry.date).format('YYYY-MM-DD'));
          setValue('chest', entry.chest);
          setValue('waist', entry.waist);
          setValue('hips', entry.hips);
          setValue('arms', entry.arms);
          setValue('legs', entry.legs);
          setValue('notes', entry.notes);
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching measurement data:', error);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isEdit, measurementId, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/body-measurements/${measurementId}`, data);
      } else {
        await axios.post(`${API}/body-measurements`, data);
      }
      navigate('/measurements');
    } catch (error) {
      console.error('Error saving data:', error);
      setSubmitting(false);
      alert('An error occurred while saving. Please try again.');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Body Measurements</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <FormField
          label="Date"
          name="date"
          type="date"
          register={register}
          error={errors.date}
          defaultValue={dayjs().format('YYYY-MM-DD')}
          required
        />
        
        <FormField
          label="Chest (inches)"
          name="chest"
          type="number"
          step="0.25"
          register={register}
          error={errors.chest}
        />
        
        <FormField
          label="Waist (inches)"
          name="waist"
          type="number"
          step="0.25"
          register={register}
          error={errors.waist}
        />
        
        <FormField
          label="Hips (inches)"
          name="hips"
          type="number"
          step="0.25"
          register={register}
          error={errors.hips}
        />
        
        <FormField
          label="Arms (inches)"
          name="arms"
          type="number"
          step="0.25"
          register={register}
          error={errors.arms}
        />
        
        <FormField
          label="Legs (inches)"
          name="legs"
          type="number"
          step="0.25"
          register={register}
          error={errors.legs}
        />
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            {...register('notes')}
          ></textarea>
        </div>
        
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
          
          <Button
            className="bg-gray-500 hover:bg-gray-700"
            onClick={() => navigate('/measurements')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

const MeasurementsList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/body-measurements`);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching measurements data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`${API}/body-measurements/${id}`);
        setData(data.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Body Measurements</h1>
        <Link to="/measurements/add" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Measurement
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Chest</th>
                <th className="py-2 px-4 text-left">Waist</th>
                <th className="py-2 px-4 text-left">Hips</th>
                <th className="py-2 px-4 text-left">Arms</th>
                <th className="py-2 px-4 text-left">Legs</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="py-2 px-4">{dayjs(entry.date).format('MMM D, YYYY')}</td>
                  <td className="py-2 px-4">{entry.chest || '-'}</td>
                  <td className="py-2 px-4">{entry.waist || '-'}</td>
                  <td className="py-2 px-4">{entry.hips || '-'}</td>
                  <td className="py-2 px-4">{entry.arms || '-'}</td>
                  <td className="py-2 px-4">{entry.legs || '-'}</td>
                  <td className="py-2 px-4 flex space-x-2">
                    <Link to={`/measurements/edit/${entry.id}`} className="text-blue-500 hover:text-blue-700">
                      Edit
                    </Link>
                    <button 
                      onClick={() => deleteEntry(entry.id)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No measurements found. Add your first measurement to get started!</p>
      )}
    </div>
  );
};

// Peptide Calculator and Form
const PeptideCalculator = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      vial_amount_mg: 5,
      bac_water_ml: 2,
      dose_mcg: 250
    }
  });
  
  const [calculation, setCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);
  
  const onSubmit = async (data) => {
    setCalculating(true);
    try {
      const response = await axios.post(`${API}/peptides/calculate-iu`, {
        vial_amount_mg: parseFloat(data.vial_amount_mg),
        bac_water_ml: parseFloat(data.bac_water_ml),
        dose_mcg: parseFloat(data.dose_mcg)
      });
      
      setCalculation(response.data);
    } catch (error) {
      console.error('Error calculating IU:', error);
      alert('An error occurred during calculation. Please check your inputs and try again.');
    } finally {
      setCalculating(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Peptide Dosage Calculator</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FormField
            label="Vial Amount (mg)"
            name="vial_amount_mg"
            type="number"
            step="0.01"
            register={register}
            error={errors.vial_amount_mg}
            required
          />
          
          <FormField
            label="BAC Water (ml)"
            name="bac_water_ml"
            type="number"
            step="0.1"
            register={register}
            error={errors.bac_water_ml}
            required
          />
          
          <FormField
            label="Desired Dose (mcg)"
            name="dose_mcg"
            type="number"
            step="1"
            register={register}
            error={errors.dose_mcg}
            required
          />
        </div>
        
        <Button type="submit" disabled={calculating}>
          {calculating ? 'Calculating...' : 'Calculate IU'}
        </Button>
      </form>
      
      {calculation && (
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-bold text-lg mb-2">Results:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Injection Amount: <span className="font-bold text-blue-600">{calculation.iu} IU</span></p>
              <p className="text-sm text-gray-600">(Equivalent to {calculation.details.volume_ml} ml)</p>
            </div>
            <div>
              <p className="text-sm">Vial Concentration: {calculation.details.concentration_mcg_ml} mcg/ml</p>
              <p className="text-sm">Total Peptide: {calculation.details.vial_amount_mcg} mcg</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PeptideForm = ({ isEdit = false }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedIU, setCalculatedIU] = useState(null);
  const navigate = useNavigate();
  const peptideId = window.location.pathname.split('/').pop();
  
  // Watch values for real-time calculation
  const vialAmount = watch('vial_amount_mg');
  const bacWater = watch('bac_water_ml');
  const dose = watch('dose_mcg');
  
  useEffect(() => {
    // Calculate IU when values change
    if (vialAmount && bacWater && dose) {
      const calculateIU = async () => {
        try {
          const response = await axios.post(`${API}/peptides/calculate-iu`, {
            vial_amount_mg: parseFloat(vialAmount),
            bac_water_ml: parseFloat(bacWater),
            dose_mcg: parseFloat(dose)
          });
          setCalculatedIU(response.data);
        } catch (error) {
          console.error('Error calculating IU:', error);
        }
      };
      
      calculateIU();
    }
  }, [vialAmount, bacWater, dose]);

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${API}/peptides/${peptideId}`);
          const peptide = response.data;
          
          setValue('name', peptide.name);
          setValue('vial_amount_mg', peptide.vial_amount_mg);
          setValue('bac_water_ml', peptide.bac_water_ml);
          setValue('dose_mcg', peptide.dose_mcg);
          setValue('injection_needle_size', peptide.injection_needle_size);
          
          // Set schedule values
          setValue('schedule.frequency', peptide.schedule.frequency);
          setValue('schedule.times_per_day', peptide.schedule.times_per_day);
          setValue('schedule.time_of_day', peptide.schedule.time_of_day);
          setValue('schedule.cycle_weeks_on', peptide.schedule.cycle_weeks_on);
          setValue('schedule.cycle_weeks_off', peptide.schedule.cycle_weeks_off);
          setValue('schedule.custom_days', peptide.schedule.custom_days);
          setValue('schedule.custom_times', peptide.schedule.custom_times);
          
          if (peptide.start_date) {
            setValue('start_date', dayjs(peptide.start_date).format('YYYY-MM-DD'));
          }
          if (peptide.end_date) {
            setValue('end_date', dayjs(peptide.end_date).format('YYYY-MM-DD'));
          }
          
          setValue('notes', peptide.notes);
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching peptide data:', error);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isEdit, peptideId, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    
    // Format the schedule data
    const scheduleData = {
      frequency: data.schedule.frequency,
      times_per_day: parseInt(data.schedule.times_per_day),
      time_of_day: Array.isArray(data.schedule.time_of_day) ? data.schedule.time_of_day : [data.schedule.time_of_day],
      cycle_weeks_on: data.schedule.cycle_weeks_on ? parseInt(data.schedule.cycle_weeks_on) : null,
      cycle_weeks_off: data.schedule.cycle_weeks_off ? parseInt(data.schedule.cycle_weeks_off) : null,
      custom_days: data.schedule.custom_days,
      custom_times: data.schedule.custom_times
    };
    
    // Replace the schedule object with the formatted one
    data.schedule = scheduleData;
    
    try {
      if (isEdit) {
        await axios.put(`${API}/peptides/${peptideId}`, data);
      } else {
        await axios.post(`${API}/peptides`, data);
      }
      navigate('/peptides');
    } catch (error) {
      console.error('Error saving peptide:', error);
      setSubmitting(false);
      alert('An error occurred while saving. Please try again.');
    }
  };

  if (loading) {
    return <Loading />;
  }

  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monday-friday", label: "Monday-Friday" },
    { value: "custom", label: "Custom" }
  ];

  const timeOfDayOptions = [
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
    { value: "custom", label: "Custom Time" }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Peptide</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Peptide Information</h2>
          
          <FormField
            label="Peptide Name"
            name="name"
            register={register}
            error={errors.name}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Vial Amount (mg)"
              name="vial_amount_mg"
              type="number"
              step="0.01"
              register={register}
              error={errors.vial_amount_mg}
              required
            />
            
            <FormField
              label="BAC Water (ml)"
              name="bac_water_ml"
              type="number"
              step="0.1"
              register={register}
              error={errors.bac_water_ml}
              required
            />
            
            <FormField
              label="Dose (mcg)"
              name="dose_mcg"
              type="number"
              step="1"
              register={register}
              error={errors.dose_mcg}
              required
            />
          </div>
          
          <FormField
            label="Injection Needle Size"
            name="injection_needle_size"
            register={register}
            error={errors.injection_needle_size}
            required
          />
          
          {calculatedIU && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h3 className="font-bold">Calculated Dosage:</h3>
              <p>Injection Amount: <span className="font-bold text-blue-600">{calculatedIU.iu} IU</span> ({calculatedIU.details.volume_ml} ml)</p>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Dosing Schedule</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Frequency
              </label>
              <select 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('schedule.frequency')}
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <FormField
              label="Times Per Day"
              name="schedule.times_per_day"
              type="number"
              min="1"
              register={register}
              error={errors['schedule.times_per_day']}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Time of Day
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {timeOfDayOptions.map(option => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`time_${option.value}`}
                    value={option.value}
                    className="mr-2"
                    {...register('schedule.time_of_day')}
                  />
                  <label htmlFor={`time_${option.value}`}>{option.label}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              label="Cycle Weeks On"
              name="schedule.cycle_weeks_on"
              type="number"
              min="0"
              register={register}
              error={errors['schedule.cycle_weeks_on']}
            />
            
            <FormField
              label="Cycle Weeks Off"
              name="schedule.cycle_weeks_off"
              type="number"
              min="0"
              register={register}
              error={errors['schedule.cycle_weeks_off']}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Custom Days (comma separated)
              </label>
              <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mon,Wed,Fri"
                {...register('schedule.custom_days')}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Custom Times (comma separated)
              </label>
              <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 8:00,20:00"
                {...register('schedule.custom_times')}
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              label="Start Date"
              name="start_date"
              type="date"
              register={register}
              error={errors.start_date}
            />
            
            <FormField
              label="End Date"
              name="end_date"
              type="date"
              register={register}
              error={errors.end_date}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Notes
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              {...register('notes')}
            ></textarea>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Peptide'}
          </Button>
          
          <Button
            className="bg-gray-500 hover:bg-gray-700"
            onClick={() => navigate('/peptides')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

const PeptideList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/peptides`);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching peptides:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this peptide?')) {
      try {
        await axios.delete(`${API}/peptides/${id}`);
        setData(data.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting peptide:', error);
      }
    }
  };

  const getScheduleText = (schedule) => {
    if (!schedule) return 'Not specified';
    
    let text = '';
    switch (schedule.frequency) {
      case 'daily':
        text = 'Daily';
        break;
      case 'weekly':
        text = 'Weekly';
        break;
      case 'monday-friday':
        text = 'Mon-Fri';
        break;
      case 'custom':
        text = schedule.custom_days ? `Custom: ${schedule.custom_days}` : 'Custom';
        break;
      default:
        text = schedule.frequency;
    }
    
    text += `, ${schedule.times_per_day}x/day`;
    
    if (schedule.cycle_weeks_on && schedule.cycle_weeks_off) {
      text += ` (${schedule.cycle_weeks_on} wk on, ${schedule.cycle_weeks_off} wk off)`;
    }
    
    return text;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Peptides</h1>
        <Link to="/peptides/add" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Peptide
        </Link>
      </div>
      
      <PeptideCalculator />

      {loading ? (
        <Loading />
      ) : data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Dosage</th>
                <th className="py-2 px-4 text-left">IU</th>
                <th className="py-2 px-4 text-left">Schedule</th>
                <th className="py-2 px-4 text-left">Needle Size</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((peptide) => (
                <tr key={peptide.id} className="border-t">
                  <td className="py-2 px-4">{peptide.name}</td>
                  <td className="py-2 px-4">{peptide.dose_mcg} mcg</td>
                  <td className="py-2 px-4">{peptide.calculated_iu} IU</td>
                  <td className="py-2 px-4">{getScheduleText(peptide.schedule)}</td>
                  <td className="py-2 px-4">{peptide.injection_needle_size}</td>
                  <td className="py-2 px-4 flex space-x-2">
                    <Link to={`/peptides/edit/${peptide.id}`} className="text-blue-500 hover:text-blue-700">
                      Edit
                    </Link>
                    <button 
                      onClick={() => deleteEntry(peptide.id)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No peptides found. Add your first peptide to get started!</p>
      )}
    </div>
  );
};

// Supplements
const SupplementForm = ({ isEdit = false }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const supplementId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${API}/supplements/${supplementId}`);
          const supplement = response.data;
          
          setValue('name', supplement.name);
          setValue('dosage', supplement.dosage);
          setValue('unit', supplement.unit);
          
          // Set schedule values
          setValue('schedule.frequency', supplement.schedule.frequency);
          setValue('schedule.times_per_day', supplement.schedule.times_per_day);
          setValue('schedule.time_of_day', supplement.schedule.time_of_day);
          setValue('schedule.cycle_weeks_on', supplement.schedule.cycle_weeks_on);
          setValue('schedule.cycle_weeks_off', supplement.schedule.cycle_weeks_off);
          setValue('schedule.custom_days', supplement.schedule.custom_days);
          setValue('schedule.custom_times', supplement.schedule.custom_times);
          
          if (supplement.start_date) {
            setValue('start_date', dayjs(supplement.start_date).format('YYYY-MM-DD'));
          }
          if (supplement.end_date) {
            setValue('end_date', dayjs(supplement.end_date).format('YYYY-MM-DD'));
          }
          
          setValue('notes', supplement.notes);
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching supplement data:', error);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isEdit, supplementId, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    
    // Format the schedule data
    const scheduleData = {
      frequency: data.schedule.frequency,
      times_per_day: parseInt(data.schedule.times_per_day),
      time_of_day: Array.isArray(data.schedule.time_of_day) ? data.schedule.time_of_day : [data.schedule.time_of_day],
      cycle_weeks_on: data.schedule.cycle_weeks_on ? parseInt(data.schedule.cycle_weeks_on) : null,
      cycle_weeks_off: data.schedule.cycle_weeks_off ? parseInt(data.schedule.cycle_weeks_off) : null,
      custom_days: data.schedule.custom_days,
      custom_times: data.schedule.custom_times
    };
    
    // Replace the schedule object with the formatted one
    data.schedule = scheduleData;
    
    try {
      if (isEdit) {
        await axios.put(`${API}/supplements/${supplementId}`, data);
      } else {
        await axios.post(`${API}/supplements`, data);
      }
      navigate('/supplements');
    } catch (error) {
      console.error('Error saving supplement:', error);
      setSubmitting(false);
      alert('An error occurred while saving. Please try again.');
    }
  };

  if (loading) {
    return <Loading />;
  }

  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monday-friday", label: "Monday-Friday" },
    { value: "custom", label: "Custom" }
  ];

  const timeOfDayOptions = [
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
    { value: "custom", label: "Custom Time" }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Supplement</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Supplement Information</h2>
          
          <FormField
            label="Supplement Name"
            name="name"
            register={register}
            error={errors.name}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Dosage"
              name="dosage"
              register={register}
              error={errors.dosage}
              required
            />
            
            <FormField
              label="Unit"
              name="unit"
              register={register}
              error={errors.unit}
              required
              placeholder="mg, mcg, ml, etc."
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Dosing Schedule</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Frequency
              </label>
              <select 
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('schedule.frequency')}
                defaultValue="daily"
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <FormField
              label="Times Per Day"
              name="schedule.times_per_day"
              type="number"
              min="1"
              register={register}
              error={errors['schedule.times_per_day']}
              required
              defaultValue={1}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Time of Day
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {timeOfDayOptions.map(option => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`time_${option.value}`}
                    value={option.value}
                    className="mr-2"
                    {...register('schedule.time_of_day')}
                    defaultChecked={option.value === 'morning'}
                  />
                  <label htmlFor={`time_${option.value}`}>{option.label}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              label="Cycle Weeks On"
              name="schedule.cycle_weeks_on"
              type="number"
              min="0"
              register={register}
              error={errors['schedule.cycle_weeks_on']}
            />
            
            <FormField
              label="Cycle Weeks Off"
              name="schedule.cycle_weeks_off"
              type="number"
              min="0"
              register={register}
              error={errors['schedule.cycle_weeks_off']}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Custom Days (comma separated)
              </label>
              <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mon,Wed,Fri"
                {...register('schedule.custom_days')}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Custom Times (comma separated)
              </label>
              <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 8:00,20:00"
                {...register('schedule.custom_times')}
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              label="Start Date"
              name="start_date"
              type="date"
              register={register}
              error={errors.start_date}
            />
            
            <FormField
              label="End Date"
              name="end_date"
              type="date"
              register={register}
              error={errors.end_date}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Notes
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              {...register('notes')}
            ></textarea>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Supplement'}
          </Button>
          
          <Button
            className="bg-gray-500 hover:bg-gray-700"
            onClick={() => navigate('/supplements')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

const SupplementList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/supplements`);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching supplements:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplement?')) {
      try {
        await axios.delete(`${API}/supplements/${id}`);
        setData(data.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting supplement:', error);
      }
    }
  };

  const getScheduleText = (schedule) => {
    if (!schedule) return 'Not specified';
    
    let text = '';
    switch (schedule.frequency) {
      case 'daily':
        text = 'Daily';
        break;
      case 'weekly':
        text = 'Weekly';
        break;
      case 'monday-friday':
        text = 'Mon-Fri';
        break;
      case 'custom':
        text = schedule.custom_days ? `Custom: ${schedule.custom_days}` : 'Custom';
        break;
      default:
        text = schedule.frequency;
    }
    
    text += `, ${schedule.times_per_day}x/day`;
    
    if (schedule.cycle_weeks_on && schedule.cycle_weeks_off) {
      text += ` (${schedule.cycle_weeks_on} wk on, ${schedule.cycle_weeks_off} wk off)`;
    }
    
    return text;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supplements</h1>
        <Link to="/supplements/add" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Supplement
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Dosage</th>
                <th className="py-2 px-4 text-left">Schedule</th>
                <th className="py-2 px-4 text-left">Start Date</th>
                <th className="py-2 px-4 text-left">End Date</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((supplement) => (
                <tr key={supplement.id} className="border-t">
                  <td className="py-2 px-4">{supplement.name}</td>
                  <td className="py-2 px-4">{supplement.dosage} {supplement.unit}</td>
                  <td className="py-2 px-4">{getScheduleText(supplement.schedule)}</td>
                  <td className="py-2 px-4">{supplement.start_date ? dayjs(supplement.start_date).format('MMM D, YYYY') : '-'}</td>
                  <td className="py-2 px-4">{supplement.end_date ? dayjs(supplement.end_date).format('MMM D, YYYY') : '-'}</td>
                  <td className="py-2 px-4 flex space-x-2">
                    <Link to={`/supplements/edit/${supplement.id}`} className="text-blue-500 hover:text-blue-700">
                      Edit
                    </Link>
                    <button 
                      onClick={() => deleteEntry(supplement.id)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No supplements found. Add your first supplement to get started!</p>
      )}
    </div>
  );
};

// Health Markers
const HealthMarkerForm = ({ isEdit = false }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const markerId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${API}/health-markers/${markerId}`);
          const marker = response.data;
          
          setValue('date', dayjs(marker.date).format('YYYY-MM-DD'));
          
          if (marker.blood_pressure) {
            setValue('blood_pressure.systolic', marker.blood_pressure.systolic);
            setValue('blood_pressure.diastolic', marker.blood_pressure.diastolic);
            setValue('blood_pressure.pulse', marker.blood_pressure.pulse);
          }
          
          if (marker.lipid_panel) {
            setValue('lipid_panel.total_cholesterol', marker.lipid_panel.total_cholesterol);
            setValue('lipid_panel.hdl', marker.lipid_panel.hdl);
            setValue('lipid_panel.ldl', marker.lipid_panel.ldl);
            setValue('lipid_panel.triglycerides', marker.lipid_panel.triglycerides);
            setValue('lipid_panel.total_cholesterol_hdl_ratio', marker.lipid_panel.total_cholesterol_hdl_ratio);
          }
          
          if (marker.cbc_panel) {
            setValue('cbc_panel.wbc', marker.cbc_panel.wbc);
            setValue('cbc_panel.rbc', marker.cbc_panel.rbc);
            setValue('cbc_panel.hemoglobin', marker.cbc_panel.hemoglobin);
            setValue('cbc_panel.hematocrit', marker.cbc_panel.hematocrit);
            setValue('cbc_panel.platelets', marker.cbc_panel.platelets);
          }
          
          setValue('notes', marker.notes);
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching health marker data:', error);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isEdit, markerId, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Prepare nested objects
      const formattedData = {
        date: data.date,
        notes: data.notes,
        blood_pressure: data.blood_pressure?.systolic ? {
          systolic: parseInt(data.blood_pressure.systolic),
          diastolic: parseInt(data.blood_pressure.diastolic),
          pulse: data.blood_pressure.pulse ? parseInt(data.blood_pressure.pulse) : null
        } : null,
        lipid_panel: data.lipid_panel?.total_cholesterol ? {
          total_cholesterol: parseFloat(data.lipid_panel.total_cholesterol),
          hdl: parseFloat(data.lipid_panel.hdl),
          ldl: parseFloat(data.lipid_panel.ldl),
          triglycerides: parseFloat(data.lipid_panel.triglycerides),
          total_cholesterol_hdl_ratio: data.lipid_panel.total_cholesterol_hdl_ratio ? 
            parseFloat(data.lipid_panel.total_cholesterol_hdl_ratio) : null
        } : null,
        cbc_panel: data.cbc_panel?.wbc ? {
          wbc: parseFloat(data.cbc_panel.wbc),
          rbc: parseFloat(data.cbc_panel.rbc),
          hemoglobin: parseFloat(data.cbc_panel.hemoglobin),
          hematocrit: parseFloat(data.cbc_panel.hematocrit),
          platelets: parseFloat(data.cbc_panel.platelets)
        } : null
      };
      
      if (isEdit) {
        await axios.put(`${API}/health-markers/${markerId}`, formattedData);
      } else {
        await axios.post(`${API}/health-markers`, formattedData);
      }
      navigate('/health-markers');
    } catch (error) {
      console.error('Error saving data:', error);
      setSubmitting(false);
      alert('An error occurred while saving. Please try again.');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Edit' : 'Add'} Health Markers</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <FormField
          label="Date"
          name="date"
          type="date"
          register={register}
          error={errors.date}
          defaultValue={dayjs().format('YYYY-MM-DD')}
          required
        />
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Blood Pressure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Systolic (mmHg)"
              name="blood_pressure.systolic"
              type="number"
              register={register}
              error={errors['blood_pressure.systolic']}
            />
            
            <FormField
              label="Diastolic (mmHg)"
              name="blood_pressure.diastolic"
              type="number"
              register={register}
              error={errors['blood_pressure.diastolic']}
            />
            
            <FormField
              label="Pulse (bpm)"
              name="blood_pressure.pulse"
              type="number"
              register={register}
              error={errors['blood_pressure.pulse']}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Lipid Panel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Total Cholesterol (mg/dL)"
              name="lipid_panel.total_cholesterol"
              type="number"
              step="0.1"
              register={register}
              error={errors['lipid_panel.total_cholesterol']}
            />
            
            <FormField
              label="HDL (mg/dL)"
              name="lipid_panel.hdl"
              type="number"
              step="0.1"
              register={register}
              error={errors['lipid_panel.hdl']}
            />
            
            <FormField
              label="LDL (mg/dL)"
              name="lipid_panel.ldl"
              type="number"
              step="0.1"
              register={register}
              error={errors['lipid_panel.ldl']}
            />
            
            <FormField
              label="Triglycerides (mg/dL)"
              name="lipid_panel.triglycerides"
              type="number"
              step="0.1"
              register={register}
              error={errors['lipid_panel.triglycerides']}
            />
            
            <FormField
              label="Total Cholesterol/HDL Ratio"
              name="lipid_panel.total_cholesterol_hdl_ratio"
              type="number"
              step="0.1"
              register={register}
              error={errors['lipid_panel.total_cholesterol_hdl_ratio']}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">CBC Panel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="WBC (K/uL)"
              name="cbc_panel.wbc"
              type="number"
              step="0.1"
              register={register}
              error={errors['cbc_panel.wbc']}
            />
            
            <FormField
              label="RBC (M/uL)"
              name="cbc_panel.rbc"
              type="number"
              step="0.01"
              register={register}
              error={errors['cbc_panel.rbc']}
            />
            
            <FormField
              label="Hemoglobin (g/dL)"
              name="cbc_panel.hemoglobin"
              type="number"
              step="0.1"
              register={register}
              error={errors['cbc_panel.hemoglobin']}
            />
            
            <FormField
              label="Hematocrit (%)"
              name="cbc_panel.hematocrit"
              type="number"
              step="0.1"
              register={register}
              error={errors['cbc_panel.hematocrit']}
            />
            
            <FormField
              label="Platelets (K/uL)"
              name="cbc_panel.platelets"
              type="number"
              register={register}
              error={errors['cbc_panel.platelets']}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            {...register('notes')}
          ></textarea>
        </div>
        
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
          
          <Button
            className="bg-gray-500 hover:bg-gray-700"
            onClick={() => navigate('/health-markers')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

const HealthMarkerList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/health-markers`);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching health markers:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`${API}/health-markers/${id}`);
        setData(data.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Health Markers</h1>
        <Link to="/health-markers/add" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Entry
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Blood Pressure</th>
                <th className="py-2 px-4 text-left">Lipid Panel</th>
                <th className="py-2 px-4 text-left">CBC Panel</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((marker) => (
                <tr key={marker.id} className="border-t">
                  <td className="py-2 px-4">{dayjs(marker.date).format('MMM D, YYYY')}</td>
                  <td className="py-2 px-4">
                    {marker.blood_pressure ? (
                      <div>
                        <div>{marker.blood_pressure.systolic}/{marker.blood_pressure.diastolic} mmHg</div>
                        {marker.blood_pressure.pulse && <div>Pulse: {marker.blood_pressure.pulse} bpm</div>}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-2 px-4">
                    {marker.lipid_panel ? (
                      <div>
                        <div>Total: {marker.lipid_panel.total_cholesterol} mg/dL</div>
                        <div>HDL: {marker.lipid_panel.hdl} mg/dL</div>
                        <div>LDL: {marker.lipid_panel.ldl} mg/dL</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-2 px-4">
                    {marker.cbc_panel ? (
                      <div>
                        <div>WBC: {marker.cbc_panel.wbc} K/uL</div>
                        <div>RBC: {marker.cbc_panel.rbc} M/uL</div>
                        <div>HGB: {marker.cbc_panel.hemoglobin} g/dL</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-2 px-4 flex space-x-2">
                    <Link to={`/health-markers/edit/${marker.id}`} className="text-blue-500 hover:text-blue-700">
                      Edit
                    </Link>
                    <button 
                      onClick={() => deleteEntry(marker.id)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No health markers found. Add your first entry to get started!</p>
      )}
    </div>
  );
};

// Main App
function App() {
  return (
    <div className="App bg-gray-100 min-h-screen">
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Weight & Body Composition */}
          <Route path="/weight" element={<WeightList />} />
          <Route path="/weight/add" element={<WeightForm />} />
          <Route path="/weight/edit/:id" element={<WeightForm isEdit={true} />} />
          
          {/* Body Measurements */}
          <Route path="/measurements" element={<MeasurementsList />} />
          <Route path="/measurements/add" element={<MeasurementsForm />} />
          <Route path="/measurements/edit/:id" element={<MeasurementsForm isEdit={true} />} />
          
          {/* Health Markers */}
          <Route path="/health-markers" element={<HealthMarkerList />} />
          <Route path="/health-markers/add" element={<HealthMarkerForm />} />
          <Route path="/health-markers/edit/:id" element={<HealthMarkerForm isEdit={true} />} />
          
          {/* Supplements */}
          <Route path="/supplements" element={<SupplementList />} />
          <Route path="/supplements/add" element={<SupplementForm />} />
          <Route path="/supplements/edit/:id" element={<SupplementForm isEdit={true} />} />
          
          {/* Peptides */}
          <Route path="/peptides" element={<PeptideList />} />
          <Route path="/peptides/add" element={<PeptideForm />} />
          <Route path="/peptides/edit/:id" element={<PeptideForm isEdit={true} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;