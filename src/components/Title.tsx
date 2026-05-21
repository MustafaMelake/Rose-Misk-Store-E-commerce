interface TitleProps {
  text1: string;
  text2: string;
}

const Title: React.FC<TitleProps> = ({ text1, text2 }) => {
  return (
    <div className="inline-flex gap-2 items-center mb-3">
      <p className="text-gold-light-20">
        {text1} <span className="font-medium text-gold-base">{text2}</span>
      </p>
    </div>
  );
};

export default Title;
