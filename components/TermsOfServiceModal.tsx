
import React from 'react';

interface TermsOfServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-4" id="modal-title">
                                    Terms of Service
                                </h3>

                                <div className="mt-4 text-sm text-gray-600 space-y-4">
                                    <p className="font-medium text-gray-800">Last Updated: {new Date().toLocaleDateString()}</p>

                                    <p>
                                        Welcome to <strong>PolyU Calendar Manager</strong> (the "Service," "Platform," or "App"). By accessing or using our web application and related services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
                                    </p>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">1. Description of Service & Non-Affiliation</h4>
                                    <p>
                                        <strong>PolyU Calendar Manager</strong> is a third-party utility designed to help students manage, merge, and synchronize their university class schedules. Features include ICS file importing, event management, and generating subscription links for external calendar applications.
                                    </p>
                                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 my-2">
                                        <p className="text-amber-800">
                                            <strong>Disclaimer of Affiliation:</strong> This Service is an independent student project and is <strong>not</strong> officially affiliated with, endorsed by, or connected to <strong>The Hong Kong Polytechnic University (PolyU)</strong>. Any reference to "PolyU" is strictly for descriptive purposes to indicate the intended user base.
                                        </p>
                                    </div>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">2. User Accounts and Security</h4>
                                    <p>To access certain features (such as cloud syncing), you must register an account.</p>
                                    <ul className="list-disc ml-5 space-y-1">
                                        <li><strong>Credentials:</strong> You are responsible for maintaining the confidentiality of your login credentials (email and password).</li>
                                        <li><strong>Identity:</strong> You agree to provide accurate and current information during registration.</li>
                                        <li><strong>Account Security:</strong> You are responsible for all activities that occur under your account.</li>
                                    </ul>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">3. User Conduct and Responsibilities</h4>
                                    <p>You agree not to use the Service to:</p>
                                    <ol className="list-decimal ml-5 space-y-1">
                                        <li>Upload content that is illegal, harmful, or violates the rights of others.</li>
                                        <li>Reverse engineer or attempt to compromise the security of the application or the backend infrastructure.</li>
                                        <li>Attempt to disrupt the proper functioning of the Service.</li>
                                    </ol>

                                    <div className="mt-3">
                                        <p className="font-semibold">Calendar Subscription Links:</p>
                                        <p className="mb-2">The Service allows you to publish your schedule to a URL (e.g., <code>webcal://</code>) to sync with apps like Google Calendar or Outlook.</p>
                                        <ul className="list-disc ml-5 space-y-1">
                                            <li><strong>Privacy Warning:</strong> These subscription links are generated to be unique to you, but they are accessible to anyone who possesses the link.</li>
                                            <li><strong>Responsibility:</strong> You are solely responsible for keeping your subscription link private and for whom you share it with.</li>
                                        </ul>
                                    </div>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">4. Data Privacy and Storage</h4>
                                    <ul className="list-disc ml-5 space-y-1">
                                        <li><strong>Data Storage:</strong> Your data (events, calendar files, and account info) is stored using <strong>Supabase</strong>, a third-party backend-as-a-service provider. By using this Service, you acknowledge that your data is processed subject to Supabase's infrastructure and security standards.</li>
                                    </ul>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">5. Intellectual Property</h4>
                                    <ul className="list-disc ml-5 space-y-1">
                                        <li><strong>Our Rights:</strong> The source code, design, and functionality of the App (excluding third-party libraries) are the property of the Service operators.</li>
                                        <li><strong>Your Data:</strong> You retain all rights to the calendar data and ICS files you upload. You grant us a license to host and process this data solely for the purpose of providing the Service (e.g., generating the subscription URL).</li>
                                    </ul>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">6. Disclaimers (No Warranty)</h4>
                                    <p><strong>The Service is provided on an "AS IS" and "AS AVAILABLE" basis.</strong></p>
                                    <ul className="list-disc ml-5 space-y-1">
                                        <li><strong>Schedule Accuracy:</strong> We do not guarantee the accuracy of the parsing logic used to import your university timetable. It is your responsibility to verify that the dates, times, and locations in the App match your official university schedule.</li>
                                        <li><strong>Missed Classes:</strong> We are not liable for any missed classes, exams, or events resulting from software bugs, sync errors, server downtime, or parsing failures.</li>
                                        <li><strong>Data Loss:</strong> We are not liable for any loss of calendar data. We encourage you to keep backups of your original <code>.ics</code> files.</li>
                                    </ul>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">7. Limitation of Liability</h4>
                                    <p>
                                        To the fullest extent permitted by law, the operators of PolyU Calendar Manager shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Service, including but not limited to loss of data, academic complications, or service interruptions.
                                    </p>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">8. Termination</h4>
                                    <p>
                                        We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                                    </p>

                                    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">9. Governing Law</h4>
                                    <p>
                                        These Terms shall be governed by and construed in accordance with the laws of <strong>Hong Kong Special Administrative Region</strong>, without regard to its conflict of law provisions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServiceModal;
