import React from "react";

interface ConsentModalProps {
    onConsent: () => void;
    onDecline: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ onConsent, onDecline }) => {
    return (
        <div style={{ padding: 16, backgroundColor: "#c3dbe7", minWidth: "500px" }}>
            <div>
                <h2>Consent for Collection and Use of Personal Information</h2>
                <h3>Purpose of Collection</h3>
                <p>
                    PhishOff is collecting your <b>email and activity data</b> to enhance
                    your user experience,provide personalized services, and improve our offerings
                    <h3>Legal Authority</h3>
                    The collection of this information is authorized under the Personal Information
                    Protection Act (PIPA) of British Columbia.

                    <h3>Use and Disclosure</h3>
                    Your email and activity data will be used only for the purposes outlined above
                    and will not be shared with third parties except as required by
                    law or with your additional consent.

                    <h3>Storage and Security</h3>
                    We will take all reasonable steps to protect your personal information
                    from unauthorized access, use, or disclosure. Your data will be stored securely
                    and retained only as long as necessary for the stated purposes.

                    <h3>Your Rights</h3>
                    You have the right to:

                    1. Withdraw your consent at any time.

                    2. Request access to your personal information.

                    3. Ask for corrections to any inaccuracies.

                    If you have questions about the collection, use, or disclosure of your personal
                    information, please contact us.

                    <h3>Consent Declaration</h3>
                    By signing below, you confirm that you understand the purpose of this
                    collection and voluntarily consent to the use of your email and activity
                    data as described.
                </p>
                <div>
                    <button onClick={onConsent}>
                       I agree!
                    </button>
                    <button onClick={onDecline}>
                       I do not agree.
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsentModal;





