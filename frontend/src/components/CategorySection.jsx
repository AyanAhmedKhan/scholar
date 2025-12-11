import React from 'react';

const CategorySection = ({ title, children }) => {
    return (
        <section className="mb-8">
            <h3 className="text-lg font-semibold text-primary mb-4 border-b border-blue-100 pb-2">
                {title}
            </h3>
            <div className="bg-white rounded-lg">
                {children}
            </div>
        </section>
    );
};

export default CategorySection;
